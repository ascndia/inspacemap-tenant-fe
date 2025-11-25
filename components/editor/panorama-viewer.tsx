"use client";

import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import PanoViewer from "@egjs/view360";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<PanoViewer | null>(null);
  const currentValuesRef = useRef({ rotation: 0, pitch: 0 });
  const onRotationChangeRef = useRef(onRotationChange);
  const onPitchChangeRef = useRef(onPitchChange);
  const resizeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update refs when callbacks change
  useEffect(() => {
    onRotationChangeRef.current = onRotationChange;
    onPitchChangeRef.current = onPitchChange;
  }, [onRotationChange, onPitchChange]);

  // Initialize PanoViewer once on mount
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Wait for container to be properly sized
    const initializeViewer = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) {
        // Container not ready yet, try again
        setTimeout(initializeViewer, 100);
        return;
      }

      // Initialize with empty image, we'll set it later
      const viewer = new PanoViewer(containerRef.current!, {
        image: "",
        projectionType: "equirectangular",
      });

      viewerRef.current = viewer;

      // Handle view change events
      const handleViewChange = (e: any) => {
        const yaw = e.yaw;
        const pitch = e.pitch;

        // Only call callbacks if values actually changed significantly
        if (Math.abs(yaw - currentValuesRef.current.rotation) > 0.1) {
          onRotationChangeRef.current(yaw);
        }
        if (Math.abs(pitch - currentValuesRef.current.pitch) > 0.1) {
          onPitchChangeRef.current(pitch);
        }
      };

      viewer.on("viewChange", handleViewChange);

      return () => {
        viewer.off("viewChange", handleViewChange);
        viewer.destroy();
        viewerRef.current = null;
      };
    };

    initializeViewer();
  }, []); // Empty dependency array - only run once on mount

  // Ensure viewer is properly sized after mount
  useEffect(() => {
    if (!viewerRef.current || !containerRef.current) return;

    const resizeViewer = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        const canvas = containerRef.current!.querySelector("canvas");
        if (canvas) {
          canvas.width = rect.width;
          canvas.height = rect.height;
          canvas.style.width = `${rect.width}px`;
          canvas.style.height = `${rect.height}px`;
        }
      }
    };

    // Small delay to ensure DOM is fully rendered
    const timeoutId = setTimeout(resizeViewer, 100);
    return () => clearTimeout(timeoutId);
  }, []);

  // Update panorama source when node changes
  useEffect(() => {
    if (!viewerRef.current) return;

    const newImageUrl = selectedNode?.panorama_url || "";
    if (newImageUrl) {
      const currentImage = viewerRef.current.getImage();
      const currentSrc =
        currentImage &&
        typeof currentImage === "object" &&
        "src" in currentImage
          ? currentImage.src
          : "";
      if (currentSrc !== newImageUrl) {
        viewerRef.current.setImage(newImageUrl);
      }
    }
  }, [selectedNode?.panorama_url]);

  // Handle container resize with debouncing
  useEffect(() => {
    if (!viewerRef.current) return;

    const handleResize = () => {
      // Clear existing timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      // Set new timeout to update viewer after resize is complete
      resizeTimeoutRef.current = setTimeout(() => {
        if (viewerRef.current && containerRef.current) {
          const rect = containerRef.current.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Resize the viewer canvas to match container
            const canvas = containerRef.current.querySelector("canvas");
            if (canvas) {
              canvas.width = rect.width;
              canvas.height = rect.height;
              canvas.style.width = `${rect.width}px`;
              canvas.style.height = `${rect.height}px`;
            }

            // Force viewer to update by reloading current image if it exists
            const currentImage = viewerRef.current.getImage();
            if (
              currentImage &&
              typeof currentImage === "object" &&
              "src" in currentImage &&
              currentImage.src
            ) {
              viewerRef.current.setImage(currentImage.src);
            }
          }
        }
      }, 300); // Wait 300ms after resize ends
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, []);

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

  // Update hotspots when graph or selected node changes
  useEffect(() => {
    if (!viewerRef.current || !selectedNode) return;

    const hotspots = calculateHotspots();

    // Note: Using overlay approach for hotspots since PanoViewer hotspot API is complex
  }, [calculateHotspots]);

  // Create hotspot element
  const createHotspotElement = useCallback(
    (hotspot: any) => {
      const element = document.createElement("div");
      element.className = "hotspot-marker";
      element.style.cssText = `
      width: 30px;
      height: 30px;
      border-radius: 50%;
      background: rgba(0, 123, 255, 0.8);
      border: 2px solid white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      color: white;
      font-weight: bold;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      position: absolute;
      pointer-events: auto;
    `;

      element.addEventListener("click", () => onNavigateToNode(hotspot.nodeId));

      // Add direction arrow for close hotspots
      if (hotspot.distance < 50) {
        const arrow = document.createElement("div");
        arrow.innerHTML = "→";
        arrow.style.cssText = `
        position: absolute;
        top: -20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 16px;
        text-shadow: 0 0 3px rgba(0,0,0,0.5);
      `;
        element.appendChild(arrow);
      }

      return element;
    },
    [onNavigateToNode]
  );

  // Update hotspot positions (simplified overlay approach)
  useEffect(() => {
    if (!viewerRef.current || !containerRef.current) return;

    const hotspots = calculateHotspots();
    const container = containerRef.current;

    // Clear existing hotspot overlays
    const existingHotspots = container.querySelectorAll(".hotspot-overlay");
    existingHotspots.forEach((el) => el.remove());

    hotspots.forEach((hotspot) => {
      const element = createHotspotElement(hotspot);

      // Position hotspot based on yaw/pitch
      const yaw = hotspot.yaw;
      const pitch = hotspot.pitch;

      // Simple positioning (this is approximate and would need more complex math for accurate positioning)
      const containerRect = container.getBoundingClientRect();
      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;

      // Convert yaw/pitch to screen coordinates (simplified)
      const x = centerX + (yaw / 90) * (containerRect.width / 4);
      const y = centerY - (pitch / 60) * (containerRect.height / 4);

      element.style.left = `${Math.max(
        10,
        Math.min(containerRect.width - 40, x)
      )}px`;
      element.style.top = `${Math.max(
        10,
        Math.min(containerRect.height - 40, y)
      )}px`;

      element.classList.add("hotspot-overlay");
      container.appendChild(element);
    });
  }, [calculateHotspots, createHotspotElement]);

  return (
    <div className="flex flex-col h-full">
      {/* Panorama Container */}
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
