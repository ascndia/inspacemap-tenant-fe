"use client";

import { useLayoutEffect, useMemo } from "react";
import View360 from "@egjs/view360";
import { useGraphStore } from "@/stores/graph-store";

const FORCE_HORIZON_MODE = true;

interface HotspotData {
  nodeId: string;
  node: any;
  yaw: number;
  pitch: number;
  distance: number;
  hasPanorama: boolean; // Field baru untuk indikator visual
}

interface PanoramaHotspotsProps {
  viewerInstance: View360 | null;
  currentNode: any; // Panorama node yang sedang ditampilkan
  onNavigateToNode: (nodeId: string) => void;
}

export function PanoramaHotspots({
  viewerInstance,
  currentNode, // Panorama node yang sedang ditampilkan
  onNavigateToNode,
}: PanoramaHotspotsProps) {
  const backgroundOffset = useGraphStore((s) => s.panoramaBackgroundOffset);
  const graph = useGraphStore((s) => s.graph); // Get graph directly from store

  const hotspots = useMemo(() => {
    if (!graph || !currentNode || !currentNode.position || !graph.nodes) {
      return [] as HotspotData[];
    }

    const calculated: HotspotData[] = [];

    const neighborConnections = graph.connections.filter(
      (conn: any) =>
        conn.fromNodeId === currentNode.id || conn.toNodeId === currentNode.id
    );

    for (const connection of neighborConnections) {
      const neighborId =
        connection.fromNodeId === currentNode.id
          ? connection.toNodeId
          : connection.fromNodeId;

      const neighborNode = graph.nodes.find((n: any) => n.id === neighborId);
      if (!neighborNode || !neighborNode.position) continue;

      const dx = neighborNode.position.x - currentNode.position.x;
      const dy = neighborNode.position.y - currentNode.position.y;
      const currentZ = currentNode.position.z || 0;
      const neighborZ = neighborNode.position.z || 0;
      const dz = neighborZ - currentZ;

      const distance2D = Math.sqrt(dx * dx + dy * dy);
      const distance3D = Math.sqrt(distance2D * distance2D + dz * dz);

      if (distance3D < 0.001) continue;

      let yaw = (Math.atan2(dy, dx) * 180) / Math.PI;
      let pitch = 0;

      if (FORCE_HORIZON_MODE) {
        pitch = 0;
      } else {
        const pitchRatio = Math.max(-1, Math.min(1, dz / distance3D));
        pitch = -(Math.asin(pitchRatio) * 180) / Math.PI;
      }

      if (isNaN(yaw) || isNaN(pitch)) continue;

      // Cek ketersediaan Panorama pada tetangga
      const hasPanorama = Boolean(
        neighborNode.panorama_url && neighborNode.panorama_url.length > 0
      );

      calculated.push({
        nodeId: neighborId,
        node: neighborNode,
        yaw,
        pitch,
        distance: distance3D,
        hasPanorama, // Simpan status
      });
    }

    return calculated;
  }, [graph, currentNode]); // Only depend on graph from store and currentNode

  const offset = Number.isFinite(backgroundOffset) ? backgroundOffset : 0;

  useLayoutEffect(() => {
    if (!viewerInstance) return;

    const forceRender = () => {
      viewerInstance.hotspot.refresh();
      viewerInstance.camera.lookAt({
        yaw: viewerInstance.camera.yaw,
        pitch: viewerInstance.camera.pitch,
      });
    };

    forceRender();
    const rafId = requestAnimationFrame(forceRender);
    return () => cancelAnimationFrame(rafId);
  }, [viewerInstance, hotspots, offset]);

  return (
    <div className="view360-hotspots">
      {hotspots.map((hotspot) => {
        const rawYaw = -hotspot.yaw + offset;
        const mirroredYaw = ((rawYaw % 360) + 360) % 360;

        const finalYaw = Number.isFinite(mirroredYaw) ? mirroredYaw : 0;
        const finalPitch = Number.isFinite(hotspot.pitch) ? hotspot.pitch : 0;

        // Logika Visual: Beda warna jika tidak ada panorama
        const bgColor = hotspot.hasPanorama
          ? "bg-blue-500/80 border-white" // Normal (Biru)
          : "bg-gray-500/80 border-gray-300"; // No Panorama (Abu-abu)

        const hoverColor = hotspot.hasPanorama
          ? "hover:bg-blue-600 hover:scale-110"
          : "hover:bg-gray-600"; // Sedikit efek hover tapi jangan terlalu heboh

        return (
          <div
            key={hotspot.nodeId}
            className="view360-hotspot"
            data-yaw={finalYaw}
            data-pitch={finalPitch}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToNode(hotspot.nodeId);
            }}
            style={{ position: "absolute", zIndex: 1000 }}
          >
            <div className="flex flex-col items-center justify-center w-10 h-10 -ml-5 -mt-5">
              <div
                className={`
                  w-10 h-10 rounded-full border-2 shadow-md 
                  flex items-center justify-center text-white font-bold text-xs 
                  transition-all duration-200 cursor-pointer
                  ${bgColor} ${hoverColor}
                `}
              >
                {/* Tampilkan Panah Navigasi HANYA jika ada panorama */}
                {hotspot.distance < 50 && hotspot.hasPanorama && (
                  <span className="absolute -top-5 text-lg font-bold text-white drop-shadow-lg">
                    ↑
                  </span>
                )}

                {/* Jika tidak ada panorama, mungkin tampilkan icon 'X' atau biarkan kosong */}
                {!hotspot.hasPanorama && (
                  <span className="absolute -top-3 text-[10px] text-white/70">
                    🚫
                  </span>
                )}

                <span className="text-[8px] mt-1 truncate max-w-[50px] text-center leading-tight select-none">
                  {hotspot.node.label || hotspot.nodeId.slice(4, 8)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
