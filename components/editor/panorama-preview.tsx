"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGraph } from "@/contexts/graph-context";

export function PanoramaPreview() {
  const { selectedNode } = useGraph();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
  const [fov, setFov] = useState(75);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Load panorama image
  useEffect(() => {
    if (selectedNode?.panoramaUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        setImage(img);
      };
      img.src = selectedNode.panoramaUrl;
    } else {
      setImage(null);
    }
  }, [selectedNode?.panoramaUrl]);

  // Update local state when selected node changes
  useEffect(() => {
    if (selectedNode) {
      setRotation(selectedNode.rotation || 0);
      setFov(selectedNode.fov || 75);
    }
  }, [selectedNode]);

  // Draw panorama on canvas
  const drawPanorama = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = canvas;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate visible portion based on rotation and FOV
    const imageWidth = image.width;
    const imageHeight = image.height;

    // For equirectangular projection, we map rotation to horizontal offset
    const rotationOffset = (rotation / 360) * imageWidth;

    // Calculate FOV-based cropping
    const fovRatio = fov / 360; // FOV as fraction of full 360°
    const visibleWidth = imageWidth * fovRatio;
    const startX =
      (rotationOffset - visibleWidth / 2 + imageWidth) % imageWidth;

    // Draw the visible portion
    if (startX + visibleWidth <= imageWidth) {
      // Single draw
      ctx.drawImage(
        image,
        startX,
        0,
        visibleWidth,
        imageHeight,
        0,
        0,
        width,
        height
      );
    } else {
      // Wrap around (two draws needed)
      const firstWidth = imageWidth - startX;
      const secondWidth = visibleWidth - firstWidth;

      ctx.drawImage(
        image,
        startX,
        0,
        firstWidth,
        imageHeight,
        0,
        0,
        (firstWidth / visibleWidth) * width,
        height
      );

      ctx.drawImage(
        image,
        0,
        0,
        secondWidth,
        imageHeight,
        (firstWidth / visibleWidth) * width,
        0,
        (secondWidth / visibleWidth) * width,
        height
      );
    }

    // Add FOV indicator overlay
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Add center crosshair
    ctx.strokeStyle = "rgba(255, 255, 255, 0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 10, height / 2);
    ctx.lineTo(width / 2 + 10, height / 2);
    ctx.moveTo(width / 2, height / 2 - 10);
    ctx.lineTo(width / 2, height / 2 + 10);
    ctx.stroke();
  }, [image, rotation, fov]);

  // Redraw when parameters change
  useEffect(() => {
    drawPanorama();
  }, [drawPanorama]);

  if (!selectedNode?.panoramaUrl) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
        Select a node with a panorama image to preview
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* 2D Panorama Viewer */}
      <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={400}
          height={240}
          className="w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
