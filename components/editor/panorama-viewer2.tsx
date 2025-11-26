"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import View360, { EquirectProjection, EVENTS } from "@egjs/view360";
import { useGraphStore } from "@/stores/graph-store";

const normalizeYaw = (yaw: number) => ((yaw % 360) + 360) % 360;
const clampPitch = (pitch: number) => Math.max(-90, Math.min(90, pitch));

interface HotspotData {
  nodeId: string;
  node: any;
  yaw: number;
  pitch: number;
  distance: number;
}

/**
 * Dokumentasi Solusi:
 *
 * Masalah:
 * Panorama viewer gagal melakukan sinkronisasi pembaruan rotasi dari global store (misalnya, dari slider)
 * karena masalah "race condition" dan "stale closure".
 * 1. `viewerRef` tidak memicu re-render, sehingga efek sinkronisasi berjalan dengan viewer lama atau null.
 * 2. Loop event `viewChange` bertentangan dengan pembaruan programatik (slider -> viewer -> event -> slider).
 * 3. Metode `lookAt` di v4 beta terkadang diabaikan jika viewer masih dalam proses inisialisasi atau animasi.
 *
 * Perbaikan yang Diterapkan:
 * 1. Mengganti `useRef` untuk instance viewer dengan `useState` (`viewerInstance`). Ini memastikan bahwa
 * setiap `useEffect` yang bergantung pada viewer akan dijalankan ulang tepat ketika viewer dibuat/siap.
 * 2. Menambahkan state `isViewerReady` untuk melacak event `EVENTS.READY`. Perintah sinkronisasi diantrekan/diblokir
 * sampai viewer memberi sinyal bahwa gambar telah dimuat sepenuhnya.
 * 3. Menggunakan `animateTo({ duration: 0 })` alih-alih `lookAt`. Di v4 beta, `animateTo` dengan durasi 0
 * lebih dapat diandalkan untuk menimpa inersia/animasi yang ada daripada `lookAt`.
 * 4. Menerapkan mekanisme "Pencegahan Loop" yang kuat menggunakan ref `isProgrammaticRotate`. Ini menandai
 * pembaruan yang berasal dari kode sehingga handler `viewChange` tahu untuk mengabaikannya, memutus loop tak terbatas.
 */

export default function PanoramaViewer({
  selectedNode,
  graph,
  onNavigateToNode,
  onRotationChange,
  onPitchChange,
  initialYaw = 0,
  initialPitch = 0,
}: {
  selectedNode: any;
  graph?: any;
  onNavigateToNode: (nodeId: string) => void;
  onRotationChange?: (yaw: number) => void;
  onPitchChange?: (pitch: number) => void;
  initialYaw?: number;
  initialPitch?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // [PERBAIKAN 1] Gunakan State alih-alih Ref untuk instance viewer
  // Ini sangat penting agar array dependensi React bekerja dengan benar.
  // Ketika viewer dibuat, state ini diperbarui, memicu "Efek Sinkronisasi" di bawah.
  const [viewerInstance, setViewerInstance] = useState<View360 | null>(null);

  // [PERBAIKAN 2] Lacak status kesiapan
  // View360 sering mengabaikan perintah rotasi yang dikirim sebelum gambar dimuat.
  const [isViewerReady, setIsViewerReady] = useState(false); // [BARU] Lacak kesiapan

  const [hotspots, setHotspots] = useState<HotspotData[]>([]);

  // [PERBAIKAN 4] Ref Pencegahan Loop
  // Digunakan untuk membedakan antara "Pengguna Menyeret" vs "Kode Memperbarui"
  const isProgrammaticRotate = useRef(false);
  const lastProgrammaticUpdate = useRef<number>(0);

  // Konektor Global Store
  const panoramaSource = useGraphStore((s) => s.panoramaLastUpdateSource);
  const panoramaYaw = useGraphStore((s) => s.panoramaYaw);
  const panoramaPitch = useGraphStore((s) => s.panoramaPitch);
  const setPanoramaRotation = useGraphStore((s) => s.setPanoramaRotation);
  const panoramaDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Hitung Hotspot (Sama seperti sebelumnya)
  const calculateHotspots = useCallback(() => {
    if (!selectedNode || !graph?.nodes || !graph?.connections) return [];
    const calculated: HotspotData[] = [];
    const currentNode = selectedNode;
    const neighborConnections = graph.connections.filter(
      (conn: any) =>
        conn.fromNodeId === currentNode.id || conn.toNodeId === currentNode.id
    );

    for (const connection of neighborConnections) {
      const neighborId =
        connection.fromNodeId === currentNode.id
          ? connection.toNodeId
          : connection.fromNodeId;
      const neighborNode = graph.nodes.find(
        (node: any) => node.id === neighborId
      );
      if (!neighborNode) continue;

      const dx = neighborNode.position.x - currentNode.position.x;
      const dy = neighborNode.position.y - currentNode.position.y;
      const dz = neighborNode.position.z - currentNode.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Gunakan yaw kamera langsung jika tersedia, jika tidak gunakan initial
      const currentYaw = viewerInstance
        ? viewerInstance.camera.yaw
        : initialYaw;
      const headingRad = (currentYaw * Math.PI) / 180;

      const nx = dx / distance;
      const ny = dy / distance;
      const nz = dz / distance;
      const rx = nx * Math.cos(headingRad) - ny * Math.sin(headingRad);
      const ry = nx * Math.sin(headingRad) + ny * Math.cos(headingRad);
      const rz = nz;

      const yaw = (Math.atan2(ry, rx) * 180) / Math.PI;
      const pitch = -(Math.asin(Math.max(-1, Math.min(1, rz))) * 180) / Math.PI;

      calculated.push({
        nodeId: neighborId,
        node: neighborNode,
        yaw,
        pitch,
        distance,
      });
    }
    return calculated;
  }, [selectedNode, graph, viewerInstance, initialYaw]);

  useEffect(() => {
    setHotspots(calculateHotspots() as HotspotData[]);
  }, [calculateHotspots]);

  // 2. Pengaturan Viewer (Siklus Hidup Inisialisasi)
  useEffect(() => {
    if (!containerRef.current || !selectedNode?.panorama_url) return;

    const instanceId = Math.random().toString(36).substring(7);
    console.log(`[Viewer ${instanceId}] Menginisialisasi...`);

    const viewer = new View360(containerRef.current, {
      projection: new EquirectProjection({
        src: selectedNode.panorama_url,
      }),
      wheelScrollable: false,
      // Nonaktifkan autoplay/autoInit untuk memiliki kontrol lebih jika diperlukan
    });

    // Lampirkan ID
    (viewer as any)._id = instanceId;

    // [Implementasi PERBAIKAN 2] Listener Event READY
    // Kita menunggu event ini sebelum mencoba menyinkronkan status rotasi apa pun.
    // Perintah lookAt sering diabaikan jika dipanggil sebelum gambar siap.
    viewer.once(EVENTS.READY, () => {
      console.log(`[Viewer ${instanceId}] SIAP. Menerapkan rotasi awal/store.`);
      setIsViewerReady(true);

      // Prioritas: Nilai Global Store jika ada (sync), jika tidak Props Awal
      const storeState = useGraphStore.getState();
      const startYaw = storeState.panoramaYaw ?? initialYaw;
      const startPitch = storeState.panoramaPitch ?? initialPitch;

      viewer.camera.lookAt({ yaw: startYaw, pitch: startPitch });
    });

    // [Implementasi PERBAIKAN 4] Handler Perubahan Tampilan (Interaksi Pengguna)
    const onViewChange = (evt: any) => {
      // Jika flag pembaruan dinaikkan, berarti KITA yang menyebabkan perubahan ini melalui kode.
      // Kita mengabaikannya untuk mencegah loop.
      if (isProgrammaticRotate.current) return;

      // Cek Debounce/Grace period untuk inersia
      // Abaikan rebound dari pembaruan cepat
      if (Date.now() - lastProgrammaticUpdate.current < 100) return;

      const { yaw, pitch } = evt;

      // Perbarui Ref/State Lokal jika diperlukan? Tidak, biarkan store menanganinya.

      // Debounce Pembaruan ke Store untuk menghindari membanjiri pembaruan
      if (panoramaDebounceRef.current)
        clearTimeout(panoramaDebounceRef.current);
      panoramaDebounceRef.current = setTimeout(() => {
        // Kirim source "viewer" agar store tahu untuk tidak mengembalikannya lagi
        setPanoramaRotation(yaw, pitch, "viewer");
      }, 50);

      onRotationChange?.(yaw);
      onPitchChange?.(pitch);
    };

    viewer.on(EVENTS.VIEW_CHANGE, onViewChange);

    const resizeObserver = new ResizeObserver(() => viewer.resize());
    resizeObserver.observe(containerRef.current);

    // Simpan ke State (memicu re-render)
    setViewerInstance(viewer);

    return () => {
      console.log(`[Viewer ${instanceId}] Menghancurkan...`);
      setIsViewerReady(false);
      viewer.destroy();
      resizeObserver.disconnect();
      setViewerInstance(null);
    };
  }, [selectedNode?.panorama_url]);

  // 3. Sinkronisasi Global Store -> Viewer (Perbaikan Reaktivitas)
  useEffect(() => {
    // Persyaratan:
    // 1. Instance viewer harus ada.
    // 2. Viewer harus SIAP (gambar dimuat).
    // 3. Sumber TIDAK boleh "viewer" (seret pengguna).
    if (!viewerInstance || !isViewerReady || panoramaSource === "viewer")
      return;

    const yaw = Number.isFinite(panoramaYaw) ? normalizeYaw(panoramaYaw) : 0;
    const pitch = clampPitch(
      Number.isFinite(panoramaPitch) ? panoramaPitch : 0
    );

    console.log(`[Sync] Menerapkan ke ${(viewerInstance as any)._id}: ${yaw}°`);

    // Naikkan Flag: "Pembaruan ini berasal dari kode/slider"
    isProgrammaticRotate.current = true;
    lastProgrammaticUpdate.current = Date.now();

    const cam = viewerInstance.camera;

    // [Implementasi PERBAIKAN 3] Gunakan animateTo(duration: 0)
    // Hapus cam.animation.stop() karena method tidak ada.
    // Ini secara efektif menghentikan animasi/inersia sebelumnya dan memaksa lompatan.
    // 'lookAt' ditemukan tidak dapat diandalkan di v4 beta untuk menimpa status aktif.
    // Ini akan otomatis menimpa (cancel) animasi/inersia sebelumnya dan set posisi instan.
    cam.animateTo({
      yaw: yaw,
      pitch: pitch,
      duration: 0, // 0ms = Lompatan Instan (Stop & Jump)
    });

    // Turunkan flag sedikit kemudian agar event 'viewChange' akibat animateTo ini diabaikan
    setTimeout(() => {
      isProgrammaticRotate.current = false;
    }, 50);
  }, [
    panoramaYaw,
    panoramaPitch,
    panoramaSource,
    viewerInstance, // Dependensi memastikan ini berjalan pada pembuatan viewer baru
    isViewerReady, // Dependensi memastikan ini berjalan ketika gambar dimuat
  ]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative">
        <div
          ref={containerRef}
          className="view360-container absolute inset-0 w-full h-full"
        >
          <canvas
            className="view360-canvas"
            style={{ width: "100%", height: "100%" }}
          />

          <div className="view360-hotspots">
            {hotspots.map((hs) => (
              <div
                key={hs.nodeId}
                className="view360-hotspot cursor-pointer flex flex-col items-center justify-center"
                data-yaw={hs.yaw}
                data-pitch={hs.pitch}
                onClick={() => onNavigateToNode(hs.nodeId)}
                style={{
                  transform: "translate(-50%, -50%)",
                  position: "absolute",
                }}
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/80 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs hover:bg-blue-600 transition-colors">
                  {hs.distance < 50 && (
                    <span className="absolute -top-5 text-lg font-bold">↑</span>
                  )}
                  <span className="text-[8px] mt-1 truncate max-w-[50px]">
                    {hs.node.name || hs.nodeId.slice(0, 4)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {!selectedNode && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a node to view panorama
        </div>
      )}
    </div>
  );
}
