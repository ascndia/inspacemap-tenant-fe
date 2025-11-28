"use client";

import { useLayoutEffect, useMemo } from "react";
import View360 from "@egjs/view360";
import { useGraphStore } from "@/stores/graph-store";

interface HotspotData {
  nodeId: string;
  node: any;
  yaw: number;
  pitch: number;
  distance: number;
}

interface PanoramaHotspotsProps {
  viewerInstance: View360 | null;
  onNavigateToNode: (nodeId: string) => void;
}

export function PanoramaHotspots({
  viewerInstance,
  onNavigateToNode,
}: PanoramaHotspotsProps) {
  const graph = useGraphStore((s) => s.graph);
  const selectedNodeId = useGraphStore((s) => s.selectedNodeId);
  const backgroundOffset = useGraphStore((s) => s.panoramaBackgroundOffset);

  const hotspots = useMemo(() => {
    if (!graph || !selectedNodeId) return [] as HotspotData[];
    const currentNode = graph.nodes.find((n) => n.id === selectedNodeId);
    if (!currentNode) return [] as HotspotData[];
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
      const neighborNode = graph.nodes.find((n) => n.id === neighborId);
      if (!neighborNode) continue;

      const dx = neighborNode.position.x - currentNode.position.x;
      const dy = neighborNode.position.y - currentNode.position.y;
      const dz = neighborNode.position.z - currentNode.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const yaw = (Math.atan2(dy, dx) * 180) / Math.PI;
      const pitch =
        -(Math.asin(Math.max(-1, Math.min(1, dz / distance))) * 180) / Math.PI;

      calculated.push({
        nodeId: neighborId,
        node: neighborNode,
        yaw,
        pitch,
        distance,
      });
    }

    if (calculated.length > 0) {
      console.log(
        "PanoramaHotspots: computed first hotspot yaw:",
        calculated[0].yaw
      );
    }

    return calculated;
  }, [graph, selectedNodeId]);

  useLayoutEffect(() => {
    console.log("PanoramaHotspots: refresh", {
      backgroundOffset,
      count: hotspots.length,
      viewerReady: !!viewerInstance,
    });
    console.log("PanoramaHotspots: store snapshot", {
      graphCount: graph?.nodes?.length ?? 0,
      selectedNodeId,
      backgroundOffset,
    });

    if (viewerInstance?.hotspot?.refresh) {
      try {
        viewerInstance.hotspot.refresh();
        requestAnimationFrame(() => viewerInstance.hotspot.refresh());
        setTimeout(() => viewerInstance.hotspot.refresh(), 50);
      } catch (err) {
        console.error("PanoramaHotspots: hotspot.refresh() error", err);
      }

      setTimeout(() => {
        const first = document.querySelector(`.view360-hotspot[data-yaw]`);
        console.log(
          "DOM first hotspot data-yaw:",
          first?.getAttribute("data-yaw"),
          "first original yaw:",
          hotspots[0]?.yaw
        );
      }, 60);
    }
  }, [viewerInstance, hotspots, backgroundOffset, graph, selectedNodeId]);

  const offset = Number.isFinite(backgroundOffset) ? backgroundOffset : 0;

  return (
    <div className="view360-hotspots">
      {hotspots.map((hotspot) => {
        const mirroredYaw = (((-hotspot.yaw + offset) % 360) + 360) % 360;
        return (
          <div
            key={hotspot.nodeId}
            className="view360-hotspot"
            data-yaw={mirroredYaw}
            data-pitch={hotspot.pitch}
            onClick={(e) => {
              e.stopPropagation();
              onNavigateToNode(hotspot.nodeId);
            }}
            style={{ position: "absolute", zIndex: 1000 }}
          >
            <div className="flex flex-col items-center justify-center w-10 h-10 -ml-5 -mt-5">
              <div className="w-10 h-10 rounded-full bg-blue-500/80 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs hover:bg-blue-600 transition-colors transform hover:scale-110 duration-200 cursor-pointer">
                {hotspot.distance < 50 && (
                  <span className="absolute -top-5 text-lg font-bold text-white drop-shadow-lg">
                    ↑
                  </span>
                )}
                <span className="text-[8px] mt-1 truncate max-w-[50px] text-center leading-tight select-none">
                  {hotspot.node.label || hotspot.nodeId.slice(0, 4)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
