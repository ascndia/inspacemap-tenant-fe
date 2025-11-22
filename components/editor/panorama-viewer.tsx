"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
// Panorama Viewer Component
export default function PanoramaViewer({
  selectedNode,
  onRotationChange,
  onPitchChange,
  rotationSpeed = 0.5,
  isDraggingNode = false,
}: {
  selectedNode: any;
  onRotationChange: (rotation: number) => void;
  onPitchChange: (pitch: number) => void;
  rotationSpeed?: number;
  isDraggingNode?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0); // yaw (horizontal)
  const [pitch, setPitch] = useState(0); // pitch (vertical)
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Use refs for drag state to avoid unnecessary re-renders
  const dragStateRef = useRef({
    startX: 0,
    startY: 0,
    startRotation: 0,
    startPitch: 0,
  });

  // Use refs for current rotation/pitch values (for real-time rendering)
  const currentRotationRef = useRef(rotation);
  const currentPitchRef = useRef(pitch);

  // Flag to prevent rendering during drag end transition
  const isDragEndingRef = useRef(false);

  // Animation frame ref for throttling
  const animationFrameRef = useRef<number | null>(null);

  // Cached image data to avoid re-processing
  const imageDataCache = useRef<ImageData | null>(null);

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

  // Helper function to calculate rotation matrices
  const getRotationMatrices = useCallback(
    (yaw: number, cameraPitch: number) => {
      const yawRad = (yaw * Math.PI) / 180;
      const pitchRad = (cameraPitch * Math.PI) / 180;
      return {
        cosYaw: Math.cos(yawRad),
        sinYaw: Math.sin(yawRad),
        cosPitch: Math.cos(pitchRad),
        sinPitch: Math.sin(pitchRad),
      };
    },
    []
  );

  // Memoize rotation matrices to avoid recalculation
  const rotationMatrices = useMemo(() => {
    return getRotationMatrices(rotation, pitch);
  }, [rotation, pitch, getRotationMatrices]);

  // Memoize processed image data to avoid re-processing on resize
  const processedImageData = useMemo(() => {
    if (!image) return null;

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) return null;

    tempCanvas.width = image.width;
    tempCanvas.height = image.height;
    tempCtx.drawImage(image, 0, 0);
    return tempCtx.getImageData(0, 0, image.width, image.height);
  }, [image]);

  // Draw equirectangular 360° panorama with proper spherical projection
  const drawPanorama = useCallback(
    (
      currentRotation = currentRotationRef.current,
      currentPitch = currentPitchRef.current
    ) => {
      const canvas = canvasRef.current;
      if (!canvas || !processedImageData) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const width = canvas.width;
      const height = canvas.height;

      // Clear canvas
      ctx.clearRect(0, 0, width, height);

      // For equirectangular 360° panorama (assume 2:1 aspect ratio)
      const imageWidth = processedImageData.width;
      const imageHeight = processedImageData.height;
      const sourceData = processedImageData.data;

      // Field of view in radians (90° horizontal)
      const fov = (90 * Math.PI) / 180;
      const aspectRatio = width / height;

      // For each pixel in the output canvas, calculate the corresponding
      // position on the equirectangular image using ray casting (like GLSL shader)
      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      // Use rotation matrices for current rotation/pitch values
      const { cosYaw, sinYaw, cosPitch, sinPitch } = getRotationMatrices(
        currentRotation,
        currentPitch
      );

      // Pre-compute FOV scaling
      const fovScale = Math.tan(fov / 2);
      const aspect = width / height;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Convert screen coordinates to normalized device coordinates (-1 to 1)
          const ndcX = (x / width) * 2 - 1;
          const ndcY = (y / height) * 2 - 1;

          // Create ray from camera (like GLSL shader)
          // Z is forward (-1.0), apply FOV scaling
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
          const clampedSourceY = Math.max(
            0,
            Math.min(imageHeight - 1, sourceY)
          );

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
    },
    [processedImageData, getRotationMatrices]
  );

  useEffect(() => {
    if (selectedNode && !isDraggingNode) {
      const newRotation = selectedNode.rotation || 0;
      const newPitch = selectedNode.pitch || 0;
      setRotation(newRotation);
      setPitch(newPitch);
      // Sync refs with state
      currentRotationRef.current = newRotation;
      currentPitchRef.current = newPitch;
      // Draw with new values
      drawPanorama(newRotation, newPitch);
    }
  }, [
    selectedNode?.rotation,
    selectedNode?.pitch,
    drawPanorama,
    isDraggingNode,
  ]);

  // Resize canvas to match container while maintaining aspect ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let resizeTimeout: NodeJS.Timeout;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;

      // Only resize if dimensions actually changed
      if (
        canvas.width !== containerWidth ||
        canvas.height !== containerHeight
      ) {
        canvas.width = containerWidth;
        canvas.height = containerHeight;
        // Trigger redraw with debouncing
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          drawPanorama();
        }, 16); // ~60fps
      }
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
      clearTimeout(resizeTimeout);
    };
  }, [drawPanorama]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      setIsDragging(true);
      dragStateRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startRotation: rotation,
        startPitch: pitch,
      };
    },
    [rotation, pitch]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (!isDragging) return;

      // Cancel previous animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      // Throttle updates using requestAnimationFrame
      animationFrameRef.current = requestAnimationFrame(() => {
        const deltaX = event.clientX - dragStateRef.current.startX;
        const deltaY = event.clientY - dragStateRef.current.startY;
        const sensitivity = 0.5;

        // Calculate new rotation values (don't update state yet)
        const newRotation =
          (dragStateRef.current.startRotation + deltaX * rotationSpeed + 360) %
          360;
        const newPitch = Math.max(
          -85,
          Math.min(85, dragStateRef.current.startPitch + deltaY * rotationSpeed)
        );

        // Update refs for immediate rendering
        currentRotationRef.current = newRotation;
        currentPitchRef.current = newPitch;

        // Draw immediately with new values (no state dependency)
        drawPanorama(newRotation, newPitch);
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Don't set state here - refs are already updated during drag
    // Just notify parent components of final values
    onRotationChange(currentRotationRef.current);
    onPitchChange(currentPitchRef.current);
  }, [onRotationChange, onPitchChange]);

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
