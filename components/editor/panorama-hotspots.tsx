"use client";

import { useEffect, useLayoutEffect } from "react";
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
  backgroundOffset?: number;
}

export function PanoramaHotspots({
  hotspots,
  viewerInstance,
  onNavigateToNode,
  backgroundOffset = 0,
}: PanoramaHotspotsProps) {
  // Use a layout effect to ensure the DOM is updated before View360 rescans hotspots
  useLayoutEffect(() => {
    // Debug log to trace when hotspot refresh is invoked
    // This helps confirm the sequence and payload when slider updates occur
    console.debug("PanoramaHotspots: refresh", {
      backgroundOffset,
      count: hotspots.length,
      viewerReady: !!viewerInstance,
    });

    if (viewerInstance?.hotspot?.refresh) {
      // Run immediate refresh
      viewerInstance.hotspot.refresh();

      // Also schedule refresh in next frame and after small delay to handle internal timing
      requestAnimationFrame(() => viewerInstance.hotspot.refresh());
      setTimeout(() => viewerInstance.hotspot.refresh(), 50);
      // Log the first hotspot DOM attribute to confirm it updated
      setTimeout(() => {
        const first = document.querySelector(`.view360-hotspot[data-yaw]`);
        console.debug(
          "DOM first hotspot data-yaw:",
          first?.getAttribute("data-yaw"),
          "first original yaw:",
          hotspots[0]?.yaw
        );
      }, 60);
    }
  }, [viewerInstance, hotspots, backgroundOffset]);

  const offset = Number.isFinite(backgroundOffset) ? backgroundOffset : 0;

  return (
    <div className="view360-hotspots">
      {hotspots.map((hotspot) => (
        <div
          key={hotspot.nodeId}
          className="view360-hotspot"
          // Mirror the yaw across the vertical axis to match View360 coordinate system
          // Some panorama viewers use the opposite sign for yaw, causing left-right mirroring.
          // We invert the yaw here so a hotspot that is to the right (+x) remains on the right in the viewer.
          data-yaw={(((-hotspot.yaw + offset) % 360) + 360) % 360}
          data-pitch={hotspot.pitch}
          onClick={(e) => {
            e.stopPropagation();
            onNavigateToNode(hotspot.nodeId);
          }}
          // [KUNCI PERBAIKAN 1]: Gunakan z-index tinggi agar clickable
          style={{ position: "absolute", zIndex: 1000 }}
        >
          {/* [KUNCI PERBAIKAN 2]: RE-CENTERING
            Elemen ikon utama adalah w-10 h-10 (40px x 40px).
            Agar "titik tengah" ikon berada tepat di koordinat hotspot,
            kita harus menggeser elemen ke kiri 20px dan ke atas 20px.
            
            Tailwind: 
            w-10 (2.5rem/40px)
            h-10 (2.5rem/40px)
            -ml-5 (margin-left: -1.25rem/-20px) -> Geser kiri setengah lebar
            -mt-5 (margin-top: -1.25rem/-20px)  -> Geser atas setengah tinggi
          */}
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
      ))}
    </div>
  );
}
