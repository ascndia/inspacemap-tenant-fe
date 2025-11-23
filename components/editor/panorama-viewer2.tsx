"use client";

import { useRef, useEffect } from "react";
import { PanoViewer } from "@egjs/view360";

// Minimal PanoramaViewer versi testing URL
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

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current) return;

    const imageUrl = selectedNode?.panorama_url || ""; // tetap ambil dari selectedNode
    const viewer = new PanoViewer(containerRef.current, {
      image: imageUrl,
      projectionType: "equirectangular",
    });
    viewerRef.current = viewer;

    return () => {
      viewer.destroy();
      viewerRef.current = null;
    };
  }, [selectedNode?.panorama_url]);

  useEffect(() => {
    if (!containerRef.current || !viewerRef.current) return;

    const observer = new ResizeObserver(() => {
      viewerRef.current!.updateViewportDimensions();
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4 relative">
        <div
          ref={containerRef}
          className="absolute inset-0 w-full h-full"
          style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        />
      </div>
      {!selectedNode && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a node to view panorama
        </div>
      )}
    </div>
  );
}
