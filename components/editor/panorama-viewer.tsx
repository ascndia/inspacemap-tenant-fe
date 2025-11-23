"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { mediaService } from "@/lib/services/media-service";
import { MediaItem } from "@/types/media";
// Panorama Viewer Component
export default function PanoramaViewer({
  selectedNode,
  onRotationChange,
  onPitchChange,
  rotationSpeed = 0.5,
  isDraggingNode = false,
  graph, // Add graph data for hotspot calculation
  onNavigateToNode, // Add navigation callback
}: {
  selectedNode: any;
  onRotationChange: (rotation: number) => void;
  onPitchChange: (pitch: number) => void;
  rotationSpeed?: number;
  isDraggingNode?: boolean;
  graph?: any; // Graph data containing nodes and connections
  onNavigateToNode: (nodeId: string) => void; // Navigation callback
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
    initialRotation: 0,
    initialPitch: 0,
  });

  // Use refs for current rotation/pitch values (for real-time rendering)
  const currentRotationRef = useRef(rotation);
  const currentPitchRef = useRef(pitch);

  // Flag to prevent rendering during drag end transition
  const isDragEndingRef = useRef(false);

  // Animation frame ref for throttling
  const animationFrameRef = useRef<number | null>(null);

  // Hotspot radius for click detection
  const hotspotRadius = 15;

  // Cached image data to avoid re-processing
  const imageDataCache = useRef<ImageData | null>(null);

  // Load panorama image
  useEffect(() => {
    const loadPanoramaImage = async () => {
      if (selectedNode?.panorama_url) {
        try {
          const img = new Image();
          // Set crossOrigin to allow canvas operations on local images
          img.crossOrigin = "anonymous";
          img.onload = () => {
            console.log(
              "Image loaded successfully:",
              selectedNode.panorama_url
            );
            setImage(img);
          };
          img.onerror = (error) => {
            console.error(
              "Failed to load image:",
              selectedNode.panorama_url,
              error
            );
            setImage(null);
          };
          img.src = selectedNode.panorama_url;
        } catch (error) {
          console.error("Failed to load panorama image:", error);
          setImage(null);
        }
      } else {
        setImage(null);
      }
    };

    loadPanoramaImage();
  }, [selectedNode?.panorama_url]);

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

      // Put the processed image data onto the canvas
      ctx.putImageData(imageData, 0, 0);
    },
    [processedImageData, getRotationMatrices]
  );

  // Calculate navigation hotspots based on graph connections
  const calculateHotspots = useCallback(() => {
    if (!selectedNode || !graph?.nodes || !graph?.connections) return [];

    const hotspots = [];
    const currentNode = selectedNode;

    // Find all connected nodes (neighbors)
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

      // Calculate direction vector from current node to neighbor
      const directionX = neighborNode.position.x - currentNode.position.x;
      const directionY = neighborNode.position.y - currentNode.position.y;
      const directionZ = neighborNode.position.z - currentNode.position.z;

      // Calculate distance
      const distance = Math.sqrt(
        directionX * directionX +
          directionY * directionY +
          directionZ * directionZ
      );
      if (distance === 0) continue; // Skip if same position

      // Normalize direction vector
      const normalizedX = directionX / distance;
      const normalizedY = directionY / distance;
      const normalizedZ = directionZ / distance;

      // Convert to spherical coordinates relative to current node's viewing direction
      // Current node's heading represents the forward direction (0° = positive X-axis)
      const headingRad = ((currentNode.heading || 0) * Math.PI) / 180;

      // Rotate direction vector by current heading to get relative direction
      const relativeX =
        normalizedX * Math.cos(headingRad) - normalizedY * Math.sin(headingRad);
      const relativeY =
        normalizedX * Math.sin(headingRad) + normalizedY * Math.cos(headingRad);
      const relativeZ = normalizedZ;

      // Calculate yaw (horizontal angle) and pitch (vertical angle)
      const yaw = (Math.atan2(relativeY, relativeX) * 180) / Math.PI;
      const pitch =
        (Math.asin(Math.max(-1, Math.min(1, relativeZ))) * 180) / Math.PI;

      hotspots.push({
        nodeId: neighborId,
        node: neighborNode,
        yaw: yaw,
        pitch: pitch,
        distance: distance,
      });
    }

    return hotspots;
  }, [selectedNode, graph]);

  // Project hotspot to screen coordinates
  const projectHotspotToScreen = useCallback(
    (
      hotspot: any,
      canvasWidth: number,
      canvasHeight: number,
      currentRotation: number,
      currentPitch: number
    ) => {
      // Calculate relative yaw and pitch from current view
      const relativeYaw = hotspot.yaw - currentRotation;
      const relativePitch = hotspot.pitch - currentPitch;

      // Normalize yaw to -180 to 180 range
      let normalizedYaw = relativeYaw;
      while (normalizedYaw > 180) normalizedYaw -= 360;
      while (normalizedYaw < -180) normalizedYaw += 360;

      // Check if hotspot is within field of view (roughly 90° horizontal, 60° vertical)
      if (Math.abs(normalizedYaw) > 45 || Math.abs(relativePitch) > 30) {
        return null; // Hotspot is outside view
      }

      // Convert to screen coordinates
      // FOV is approximately 90° horizontal
      const fovHorizontal = 90;
      const fovVertical = 60;

      const screenX =
        canvasWidth / 2 + (normalizedYaw / fovHorizontal) * (canvasWidth / 2);
      const screenY =
        canvasHeight / 2 - (relativePitch / fovVertical) * (canvasHeight / 2);

      return {
        x: Math.max(20, Math.min(canvasWidth - 20, screenX)),
        y: Math.max(20, Math.min(canvasHeight - 20, screenY)),
      };
    },
    []
  );

  // Draw navigation hotspots
  const drawHotspots = useCallback(
    (
      currentRotation = currentRotationRef.current,
      currentPitch = currentPitchRef.current
    ) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const hotspots = calculateHotspots();
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      hotspots.forEach((hotspot) => {
        const screenPos = projectHotspotToScreen(
          hotspot,
          canvasWidth,
          canvasHeight,
          currentRotation,
          currentPitch
        );
        if (!screenPos) return;

        // Draw hotspot as a circular indicator
        ctx.save();

        // Draw outer ring
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, hotspotRadius, 0, 2 * Math.PI);
        ctx.stroke();

        // Draw inner circle
        ctx.fillStyle = "#007bff";
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, hotspotRadius - 3, 0, 2 * Math.PI);
        ctx.fill();

        // Draw direction arrow if close enough
        if (hotspot.distance < 50) {
          // Within 50 units
          const angle = ((hotspot.yaw - currentRotation) * Math.PI) / 180;
          const arrowLength = 20;

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(screenPos.x, screenPos.y);
          ctx.lineTo(
            screenPos.x + Math.sin(angle) * arrowLength,
            screenPos.y - Math.cos(angle) * arrowLength
          );
          ctx.stroke();

          // Arrow head
          const headLength = 8;
          const headAngle = Math.PI / 6;
          ctx.beginPath();
          ctx.moveTo(
            screenPos.x + Math.sin(angle) * arrowLength,
            screenPos.y - Math.cos(angle) * arrowLength
          );
          ctx.lineTo(
            screenPos.x +
              Math.sin(angle - headAngle) * (arrowLength - headLength),
            screenPos.y -
              Math.cos(angle - headAngle) * (arrowLength - headLength)
          );
          ctx.moveTo(
            screenPos.x + Math.sin(angle) * arrowLength,
            screenPos.y - Math.cos(angle) * arrowLength
          );
          ctx.lineTo(
            screenPos.x +
              Math.sin(angle + headAngle) * (arrowLength - headLength),
            screenPos.y -
              Math.cos(angle + headAngle) * (arrowLength - headLength)
          );
          ctx.stroke();
        }

        ctx.restore();
      });
    },
    [calculateHotspots, projectHotspotToScreen]
  );

  // Update drawPanorama to also draw hotspots
  const drawPanoramaWithHotspots = useCallback(
    (
      currentRotation = currentRotationRef.current,
      currentPitch = currentPitchRef.current
    ) => {
      drawPanorama(currentRotation, currentPitch);
      drawHotspots(currentRotation, currentPitch);
    },
    [drawPanorama, drawHotspots]
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
      drawPanoramaWithHotspots(newRotation, newPitch);
    }
  }, [
    selectedNode?.rotation,
    selectedNode?.pitch,
    drawPanoramaWithHotspots,
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
          drawPanoramaWithHotspots();
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

  // Handle hotspot clicks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Check if click is on a hotspot
      const hotspots = calculateHotspots();
      for (const hotspot of hotspots) {
        const screenPos = projectHotspotToScreen(
          hotspot,
          canvas.width,
          canvas.height,
          currentRotationRef.current,
          currentPitchRef.current
        );
        if (!screenPos) continue;

        const distance = Math.sqrt(
          (x - screenPos.x) ** 2 + (y - screenPos.y) ** 2
        );
        if (distance <= hotspotRadius) {
          // hotspotRadius is 15
          onNavigateToNode(hotspot.nodeId);
          break;
        }
      }
    };

    canvas.addEventListener("click", handleClick);
    return () => canvas.removeEventListener("click", handleClick);
  }, [calculateHotspots, projectHotspotToScreen, onNavigateToNode]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    setIsDragging(true);
    dragStateRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      startRotation: currentRotationRef.current,
      startPitch: currentPitchRef.current,
      initialRotation: currentRotationRef.current,
      initialPitch: currentPitchRef.current,
    };
  }, []);

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

    // Only update node if rotation or pitch actually changed
    const hasRotationChanged =
      Math.abs(
        currentRotationRef.current - dragStateRef.current.initialRotation
      ) > 0.1;
    const hasPitchChanged =
      Math.abs(currentPitchRef.current - dragStateRef.current.initialPitch) >
      0.1;

    if (hasRotationChanged) {
      onRotationChange(currentRotationRef.current);
    }
    if (hasPitchChanged) {
      onPitchChange(currentPitchRef.current);
    }
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
