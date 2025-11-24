"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import View360, { EquirectProjection } from "@egjs/view360";
// Gunakan import CSS yang sesuai dengan struktur folder Anda (biasanya dist untuk beta)
// import "@egjs/view360/dist/css/view360.min.css";

interface HotspotData {
  nodeId: string;
  node: any;
  yaw: number;
  pitch: number;
  distance: number;
}

export default function PanoramaViewer({
  selectedNode,
  graph,
  onNavigateToNode,
}: {
  selectedNode: any;
  graph?: any;
  onNavigateToNode: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<View360 | null>(null);
  const [hotspots, setHotspots] = useState<HotspotData[]>([]);

  // 1. Kalkulasi Data Hotspot (Hanya menghitung Yaw/Pitch, TANPA posisi layar X/Y)
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

      // Normalisasi & Rotasi (Math logic tetap diperlukan untuk menentukan Yaw/Pitch)
      const nx = dx / distance;
      const ny = dy / distance;
      const nz = dz / distance;

      const headingRad = ((currentNode.heading || 0) * Math.PI) / 180;

      const rx = nx * Math.cos(headingRad) - ny * Math.sin(headingRad);
      const ry = nx * Math.sin(headingRad) + ny * Math.cos(headingRad);
      const rz = nz;

      const yaw = (Math.atan2(ry, rx) * 180) / Math.PI;
      const pitch = -(Math.asin(Math.max(-1, Math.min(1, rz))) * 180) / Math.PI;

      calculated.push({
        nodeId: neighborId,
        node: neighborNode,
        yaw: yaw,
        pitch: pitch,
        distance: distance,
      });
    }
    return calculated;
  }, [selectedNode, graph]);

  // Update data hotspot saat node berubah
  useEffect(() => {
    setHotspots(calculateHotspots());
  }, [calculateHotspots]);

  // 2. Setup Viewer
  useEffect(() => {
    if (!containerRef.current || !selectedNode?.panorama_url) return;

    const viewer = new View360(containerRef.current, {
      projection: new EquirectProjection({
        src: selectedNode.panorama_url,
      }),
      // FIX 1: Hapus 'mouseDragDirection' (ini properti v3 yang bikin error)
      // Di v4, drag sudah otomatis bekerja. Jika ingin membatasi, gunakan plugins: [new RotateControl({...})]

      // Matikan scroll zoom jika mengganggu
      wheelScrollable: false,
    });

    viewerRef.current = viewer;

    const resizeObserver = new ResizeObserver(() => {
      viewer.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [selectedNode?.panorama_url]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative">
        {/* Container Utama View360 */}
        <div
          ref={containerRef}
          className="view360-container absolute inset-0 w-full h-full"
        >
          {/* Canvas Wajib untuk V4 */}
          <canvas
            className="view360-canvas"
            style={{ width: "100%", height: "100%" }}
          />

          {/* FIX 2: Native Hotspot Container
            V4 akan otomatis mencari elemen dengan class "view360-hotspot" 
            di dalam container dan memposisikannya berdasarkan atribut data-yaw/pitch.
            Tidak perlu lagi perhitungan coordinateToScreen manual!
          */}
          <div className="view360-hotspots">
            {hotspots.map((hs) => (
              <div
                key={hs.nodeId}
                className="view360-hotspot cursor-pointer flex flex-col items-center justify-center"
                // Inilah MAGIC-nya V4: Cukup kasih data attribute
                data-yaw={hs.yaw}
                data-pitch={hs.pitch}
                onClick={() => onNavigateToNode(hs.nodeId)}
                style={{
                  transform: "translate(-50%, -50%)", // Centering pivot
                  position: "absolute", // Wajib absolute agar library bisa menggesernya
                }}
              >
                {/* Visual Hotspot */}
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
