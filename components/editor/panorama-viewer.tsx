"use client";

import { useRef, useEffect, useState, useCallback } from "react";
// Panorama Viewer Component
export default function PanoramaViewer({
  selectedNode,
  onRotationChange,
  onPitchChange,
}: {
  selectedNode: any;
  onRotationChange: (rotation: number) => void;
  onPitchChange: (pitch: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0); // yaw (horizontal)
  const [pitch, setPitch] = useState(0); // pitch (vertical)
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartRotation, setDragStartRotation] = useState(0);
  const [dragStartPitch, setDragStartPitch] = useState(0);

  // Load panorama image
  useEffect(() => {
    if (selectedNode?.panoramaUrl) {
      const img = new Image();
      // Remove crossOrigin for local images
      img.onload = () => {
        console.log("Image loaded successfully:", selectedNode.panoramaUrl);
        setImage(img);
      };
      img.onerror = (error) => {
        console.error("Failed to load image:", selectedNode.panoramaUrl, error);
        setImage(null);
      };
      img.src = selectedNode.panoramaUrl;
    } else {
      setImage(null);
    }
  }, [selectedNode]);

  // Draw equirectangular 360° panorama with proper spherical projection
  const drawPanorama = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !image) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (!image) {
      // Draw placeholder with error message
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#666";
      ctx.font = "14px Arial";
      ctx.textAlign = "center";
      ctx.fillText("Loading panorama...", width / 2, height / 2 - 10);
      ctx.font = "12px Arial";
      ctx.fillText(
        selectedNode.panoramaUrl || "No URL",
        width / 2,
        height / 2 + 10
      );
      return;
    }

    // For equirectangular 360° panorama (assume 2:1 aspect ratio)
    const imageWidth = image.width;
    const imageHeight = image.height;

    // Convert rotation to radians (yaw and pitch)
    const yaw = (rotation * Math.PI) / 180;
    const cameraPitch = (pitch * Math.PI) / 180;

    // Field of view in radians (90° horizontal)
    const fov = (90 * Math.PI) / 180;
    const aspectRatio = width / height;

    // For each pixel in the output canvas, calculate the corresponding
    // position on the equirectangular image using ray casting (like GLSL shader)
    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;

    // Get source image data for sampling
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return;

    tempCanvas.width = imageWidth;
    tempCanvas.height = imageHeight;
    tempCtx.drawImage(image, 0, 0);
    const sourceData = tempCtx.getImageData(0, 0, imageWidth, imageHeight).data;

    // Pre-compute rotation matrices for yaw and pitch
    const cosYaw = Math.cos(yaw);
    const sinYaw = Math.sin(yaw);
    const cosPitch = Math.cos(cameraPitch);
    const sinPitch = Math.sin(cameraPitch);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        // Convert screen coordinates to normalized device coordinates (-1 to 1)
        const ndcX = (x / width) * 2 - 1;
        const ndcY = (y / height) * 2 - 1;

        // Aspect ratio correction
        const aspect = width / height;

        // Create ray from camera (like GLSL shader)
        // Z is forward (-1.0), apply FOV scaling
        // Keep FOV constant regardless of canvas size for proportional display
        const fovScale = Math.tan(fov / 2);
        let rayX = ndcX * aspect * fovScale;
        let rayY = -ndcY * fovScale; // Flip Y because canvas Y increases downward
        let rayZ = -1.0;

        // Normalize ray
        const rayLength = Math.sqrt(rayX * rayX + rayY * rayY + rayZ * rayZ);
        rayX /= rayLength;
        rayY /= rayLength;
        rayZ /= rayLength;

        // Apply pitch rotation (rotate around X axis)
        const tempY = rayY * cosPitch - rayZ * sinPitch;
        const tempZ = rayY * sinPitch + rayZ * cosPitch;
        rayY = tempY;
        rayZ = tempZ;

        // Apply yaw rotation (rotate around Y axis)
        const tempX = rayX * cosYaw + rayZ * sinYaw;
        const tempZ2 = -rayX * sinYaw + rayZ * cosYaw;
        rayX = tempX;
        rayZ = tempZ2;

        // Convert Cartesian to Spherical coordinates (like GLSL)
        const phi = Math.atan2(rayZ, rayX); // Use atan2 for full 360° range
        const theta = Math.acos(Math.max(-1, Math.min(1, rayY))); // Clamp to avoid NaN

        // Map to equirectangular UV coordinates
        const u = (phi + Math.PI) / (2 * Math.PI); // 0 to 1
        const v = theta / Math.PI; // 0 to 1

        // Convert to pixel coordinates
        const sourceX = Math.floor(u * imageWidth) % imageWidth;
        const sourceY = Math.floor(v * imageHeight);

        // Handle negative coordinates (wrap around for seamless 360°)
        const finalSourceX = sourceX < 0 ? sourceX + imageWidth : sourceX;

        // Ensure sourceY is within bounds
        const clampedSourceY = Math.max(0, Math.min(imageHeight - 1, sourceY));

        // Get pixel color from source image
        const sourceIndex = (clampedSourceY * imageWidth + finalSourceX) * 4;
        const targetIndex = (y * width + x) * 4;

        data[targetIndex] = sourceData[sourceIndex]; // R
        data[targetIndex + 1] = sourceData[sourceIndex + 1]; // G
        data[targetIndex + 2] = sourceData[sourceIndex + 2]; // B
        data[targetIndex + 3] = sourceData[sourceIndex + 3]; // A
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [image, rotation, pitch, selectedNode]);

  useEffect(() => {
    if (selectedNode) {
      setRotation(selectedNode.rotation || 0);
      setPitch(selectedNode.pitch || 0);
    }
  }, [selectedNode]);

  // Resize canvas to match container while maintaining aspect ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Set canvas size to match container
      canvas.width = containerWidth;
      canvas.height = containerHeight;

      // Trigger redraw immediately
      drawPanorama();
    };

    // Use ResizeObserver for more accurate container size changes
    const resizeObserver = new ResizeObserver(() => {
      resizeCanvas();
    });

    const container = canvas.parentElement;
    if (container) {
      resizeObserver.observe(container);
    }

    // Initial resize
    resizeCanvas();

    return () => {
      resizeObserver.disconnect();
    };
  }, [drawPanorama]);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      setIsDragging(true);
      setDragStartX(event.clientX);
      setDragStartY(event.clientY);
      setDragStartRotation(rotation);
      setDragStartPitch(pitch);
    },
    [rotation, pitch]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging) return;

      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      const sensitivity = 0.5; // Adjust sensitivity as needed

      // Horizontal drag for yaw (left/right rotation) - INVERTED
      const newRotation =
        (dragStartRotation + deltaX * sensitivity + 360) % 360;

      // Vertical drag for pitch (up/down rotation) - INVERTED, clamp to prevent flipping
      const newPitch = Math.max(
        -85,
        Math.min(85, dragStartPitch + deltaY * sensitivity)
      );

      setRotation(newRotation);
      setPitch(newPitch);
      onRotationChange(newRotation);
      onPitchChange(newPitch);
    },
    [
      isDragging,
      dragStartX,
      dragStartY,
      dragStartRotation,
      dragStartPitch,
      onRotationChange,
      onPitchChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleRotationChange = (newRotation: number) => {
    setRotation(newRotation);
    onRotationChange(newRotation);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Panorama Canvas */}
      <div className="flex-1 bg-black rounded-lg overflow-hidden mb-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves canvas
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
