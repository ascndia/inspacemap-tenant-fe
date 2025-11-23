"use client";

import { useRef, useEffect } from "react";
import { PanoViewer } from "@egjs/view360";
import type { PanoViewerOptions } from "@egjs/view360";

export default function PanoramaViewer({
  selectedNode,
  onRotationChange,
  onPitchChange,
  rotationSpeed = 0.5,
  isDraggingNode = false,
  graph,
  onNavigateToNode,
}: {
  selectedNode: any;
  onRotationChange: (rotation: number) => void;
  onPitchChange: (pitch: number) => void;
  rotationSpeed?: number;
  isDraggingNode?: boolean;
  graph?: any;
  onNavigateToNode: (nodeId: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PanoViewer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let observer: ResizeObserver;

    observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;

      if (width === 0 || height === 0) return;

      if (!viewerRef.current && selectedNode?.panorama_url) {
        viewerRef.current = new PanoViewer(containerRef.current!, {
          image: selectedNode.panorama_url,
          projectionType: "equirectangular",
          pitchRange: [-120, 120],
          useZoom: false, // <- matikan zoom
        });
      } else if (viewerRef.current) {
        viewerRef.current.updateViewportDimensions();
      }
    });

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [selectedNode?.panorama_url]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative">
        <div ref={containerRef} className="absolute inset-0 w-full h-full" />
      </div>
      {!selectedNode && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a node to view panorama
        </div>
      )}
    </div>
  );
}
