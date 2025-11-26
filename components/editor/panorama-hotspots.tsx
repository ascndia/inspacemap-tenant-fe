"use client";

import { useEffect } from "react";
import View360 from "@egjs/view360";

interface HotspotData {
  nodeId: string;
  node: any;
  yaw: number;
  pitch: number;
  distance: number;
}

interface PanoramaHotspotsProps {
  hotspots: HotspotData[];
  viewerInstance: View360 | null;
  onNavigateToNode: (nodeId: string) => void;
}

export function PanoramaHotspots({
  hotspots,
  viewerInstance,
  onNavigateToNode,
}: PanoramaHotspotsProps) {
  // OFFICIAL DOCS: Call refresh() whenever hotspot elements are added/removed
  useEffect(() => {
    if (viewerInstance) {
      // This tells View360 to re-scan the DOM for .view360-hotspot elements
      // and attach its internal 3D projection logic to them.
      viewerInstance.hotspot.refresh();
    }
  }, [viewerInstance, hotspots]);

  // OFFICIAL DOCS STRUCTURE:
  // 1. Container must have class "view360-hotspots"
  // 2. Items must have class "view360-hotspot"
  // 3. Items must have data-yaw and data-pitch attributes
  return (
    <div className="view360-hotspots">
      {hotspots.map((hotspot) => (
        <div
          key={hotspot.nodeId}
          className="view360-hotspot"
          // The Viewer reads these attributes automatically to position the element
          data-yaw={hotspot.yaw}
          data-pitch={hotspot.pitch}
          onClick={(e) => {
            // Stop propagation so the viewer doesn't register a background click
            e.stopPropagation();
            onNavigateToNode(hotspot.nodeId);
          }}
          // Style your hotspot here (Tailwind works perfectly)
          style={{ cursor: "pointer" }}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/80 border-2 border-white shadow-md flex items-center justify-center text-white font-bold text-xs hover:bg-blue-600 transition-colors transform hover:scale-110 duration-200">
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
      ))}
    </div>
  );
}
