"use client";

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
  useLayoutEffect,
} from "react";
import View360, { EquirectProjection, EVENTS } from "@egjs/view360";
import { useGraphStore } from "@/stores/graph-store";
import { PanoramaHotspots } from "./panorama-hotspots";
import "@egjs/view360/css/view360.min.css";

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
}: {
  selectedNode: any;
  graph?: any;
  onNavigateToNode: (nodeId: string) => void;
  onRotationChange?: (yaw: number) => void;
  onPitchChange?: (pitch: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // [PERBAIKAN 1] Gunakan State alih-alih Ref untuk instance viewer
  // Ini sangat penting agar array dependensi React bekerja dengan benar.
  // Ketika viewer dibuat, state ini diperbarui, memicu "Efek Sinkronisasi" di bawah.
  const [viewerInstance, setViewerInstance] = useState<View360 | null>(null);

  // [PERBAIKAN 2] Lacak status kesiapan
  // View360 sering mengabaikan perintah rotasi yang dikirim sebelum gambar dimuat.
  const [isViewerReady, setIsViewerReady] = useState(false); // [BARU] Lacak kesiapan

  // Hotspots are now computed inside PanoramaHotspots (subscribe to store)

  // [PERBAIKAN 4] Ref Pencegahan Loop
  // Digunakan untuk membedakan antara "Pengguna Menyeret" vs "Kode Memperbarui"
  const isProgrammaticRotate = useRef(false);
  const lastProgrammaticUpdate = useRef<number>(0);

  // Konektor Global Store
  const panoramaSource = useGraphStore((s) => s.panoramaLastUpdateSource);
  const panoramaYaw = useGraphStore((s) => s.panoramaYaw);
  const panoramaPitch = useGraphStore((s) => s.panoramaPitch);
  const backgroundOffset = useGraphStore((s) => s.panoramaBackgroundOffset);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const setPanoramaRotation = useGraphStore((s) => s.setPanoramaRotation);
  const panoramaDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Hotspot computation no longer belongs to the viewer; PanoramaHotspots now reads directly from store

  // 2. Pengaturan Viewer (Siklus Hidup Inisialisasi)
  useEffect(() => {
    if (!containerRef.current || !selectedNode?.panorama_url) return;

    const instanceId = Math.random().toString(36).substring(7);
    console.log(`[Viewer ${instanceId}] Menginisialisasi...`, {
      selectedNodeId: selectedNode?.id,
    });

    const viewer = new View360(containerRef.current, {
      projection: new EquirectProjection({
        src: selectedNode.panorama_url,
      }),
      wheelScrollable: false,
      zoom: false,
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

      const baseYaw = Number.isFinite(panoramaYaw) ? panoramaYaw : 0;
      const yawTarget = normalizeYaw(baseYaw);
      const pitchTarget = clampPitch(
        Number.isFinite(panoramaPitch) ? panoramaPitch : 0
      );

      viewer.camera.lookAt({ yaw: yawTarget, pitch: pitchTarget });
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

    const baseYaw = Number.isFinite(panoramaYaw) ? panoramaYaw : 0;
    const yaw = normalizeYaw(baseYaw);
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

  useLayoutEffect(() => {
    if (!viewerInstance) return;
    // Ensure refresh runs after DOM sync to capture new data-yaw attributes
    console.log("PanoramaViewer: backgroundOffset changed", {
      backgroundOffset,
      panoramaYaw,
      panoramaPitch,
      viewerId: (viewerInstance as any)?._id,
    });

    try {
      viewerInstance.hotspot?.refresh(); // Refresh hotspots
    } catch (err) {
      console.error("PanoramaViewer: hotspot.refresh() failed", err);
    }
    // Re-run on next frame and slightly later to circumvent internal timing in view360
    requestAnimationFrame(() => viewerInstance.hotspot?.refresh());
    setTimeout(() => viewerInstance.hotspot?.refresh(), 50);

    // Fallback (force re-layout): perform a no-op animate to prompt an internal recompute.
    try {
      if (viewerInstance?.camera?.animateTo) {
        isProgrammaticRotate.current = true;
        viewerInstance.camera.animateTo({
          yaw: panoramaYaw,
          pitch: panoramaPitch,
          duration: 0,
        });
        setTimeout(() => (isProgrammaticRotate.current = false), 80);
      }
    } catch (err) {
      console.error("PanoramaViewer: no-op animateTo failed", err);
    }
  }, [viewerInstance, backgroundOffset, panoramaYaw, panoramaPitch]);

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
          <PanoramaHotspots
            currentNode={selectedNode}
            viewerInstance={viewerInstance}
            onNavigateToNode={onNavigateToNode}
          />
          <div
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 9999,
              padding: "6px 10px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.6)",
              color: "#fff",
              fontSize: 12,
            }}
          >
            <div>
              node: <strong>{selectedNodeId ?? "none"}</strong>
            </div>
            <div>
              offset: <strong>{backgroundOffset}</strong>°
            </div>
            <div>
              yaw: <strong>{Math.round(panoramaYaw)}</strong>° pitch:{" "}
              <strong>{Math.round(panoramaPitch)}</strong>°
            </div>
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
