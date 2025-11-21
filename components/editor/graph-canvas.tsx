"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGraph } from "@/contexts/graph-context";
import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  PlusCircle,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Hand,
  Link,
  Unlink,
} from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

// 2D Canvas Component for Map Editing
function MapCanvas2D({
  onNodeSelect,
  onCanvasClick,
  pathPreview,
  onNodeUpdate,
  onToolChange,
  zoom,
  panOffset,
  onZoomChange,
  onPanChange,
  addNode,
  removeNode,
}: {
  onNodeSelect: (nodeId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  pathPreview: string[] | null;
  onNodeUpdate: (nodeId: string, updates: any) => void;
  onToolChange: (tool: string) => void;
  zoom: number;
  panOffset: { x: number; y: number };
  onZoomChange: (zoom: number) => void;
  onPanChange: (panOffset: { x: number; y: number }) => void;
  addNode: (
    position: { x: number; y: number; z: number },
    attributes?: any
  ) => void;
  removeNode: (nodeId: string) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useGraph();

  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
  } | null>(null);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Save context for transformations
    ctx.save();

    // Apply zoom and pan
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoom, zoom);

    // Draw floorplan background if available
    if (state.graph?.floorplan) {
      // Placeholder for floorplan rendering
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(-500, -500, 1000, 1000);
      ctx.strokeStyle = "#ccc";
      ctx.strokeRect(-500, -500, 1000, 1000);
    }

    // Draw grid
    if (state.ui.showGrid) {
      ctx.strokeStyle = "#e0e0e0";
      ctx.lineWidth = 1 / zoom;
      const gridSize = state.graph?.settings.gridSize || 20;

      for (let x = -500; x <= 500; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, -500);
        ctx.lineTo(x, 500);
        ctx.stroke();
      }

      for (let y = -500; y <= 500; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(-500, y);
        ctx.lineTo(500, y);
        ctx.stroke();
      }
    }

    // Draw connections
    state.graph?.connections.forEach((connection) => {
      const fromNode = state.graph?.nodes.find(
        (n) => n.id === connection.fromNodeId
      );
      const toNode = state.graph?.nodes.find(
        (n) => n.id === connection.toNodeId
      );

      if (fromNode && toNode) {
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2 / zoom;
        ctx.beginPath();
        ctx.moveTo(fromNode.position.x, fromNode.position.y);
        ctx.lineTo(toNode.position.x, toNode.position.y);
        ctx.stroke();

        // Draw arrow head
        const angle = Math.atan2(
          toNode.position.y - fromNode.position.y,
          toNode.position.x - fromNode.position.x
        );
        const arrowLength = 10 / zoom;
        ctx.beginPath();
        ctx.moveTo(toNode.position.x, toNode.position.y);
        ctx.lineTo(
          toNode.position.x - arrowLength * Math.cos(angle - Math.PI / 6),
          toNode.position.y - arrowLength * Math.sin(angle - Math.PI / 6)
        );
        ctx.moveTo(toNode.position.x, toNode.position.y);
        ctx.lineTo(
          toNode.position.x - arrowLength * Math.cos(angle + Math.PI / 6),
          toNode.position.y - arrowLength * Math.sin(angle + Math.PI / 6)
        );
        ctx.stroke();
      }
    });

    // Draw path preview
    if (pathPreview && pathPreview.length > 1) {
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 3 / zoom;
      ctx.setLineDash([5 / zoom, 5 / zoom]);

      for (let i = 0; i < pathPreview.length - 1; i++) {
        const fromNode = state.graph?.nodes.find(
          (n) => n.id === pathPreview[i]
        );
        const toNode = state.graph?.nodes.find(
          (n) => n.id === pathPreview[i + 1]
        );

        if (fromNode && toNode) {
          ctx.beginPath();
          ctx.moveTo(fromNode.position.x, fromNode.position.y);
          ctx.lineTo(toNode.position.x, toNode.position.y);
          ctx.stroke();
        }
      }

      ctx.setLineDash([]);
    }

    // Draw nodes
    state.graph?.nodes.forEach((node) => {
      const isSelected = state.ui.selectedNodeId === node.id;
      const radius = 8 / zoom;

      // Node circle
      ctx.fillStyle = isSelected
        ? "#3b82f6"
        : node.panoramaUrl
        ? "#22c55e"
        : "#6b7280";
      ctx.beginPath();
      ctx.arc(node.position.x, node.position.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Node border
      ctx.strokeStyle = isSelected ? "#1e40af" : "#374151";
      ctx.lineWidth = 2 / zoom;
      ctx.stroke();

      // Node label
      ctx.fillStyle = "#000";
      ctx.font = `${12 / zoom}px Arial`;
      ctx.textAlign = "center";
      ctx.fillText(
        node.label || `Node ${node.id.slice(0, 4)}`,
        node.position.x,
        node.position.y - radius - 5 / zoom
      );
    });

    ctx.restore();
  }, [state, panOffset, zoom, pathPreview]);

  // Handle mouse events
  const handleMouseDown = useCallback(
    (event: React.MouseEvent) => {
      // Handle right-click context menu
      if (event.button === 2) {
        event.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Get canvas container position
        const canvasContainer = canvas.parentElement;
        if (!canvasContainer) return;

        const containerRect = canvasContainer.getBoundingClientRect();

        // Calculate position relative to canvas container
        const menuX = event.clientX - containerRect.left;
        const menuY = event.clientY - containerRect.top;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - panOffset.x) / zoom;
        const y = (event.clientY - rect.top - panOffset.y) / zoom;

        // Check if right-clicking on a node
        const clickedNode = state.graph?.nodes.find((node) => {
          const dx = node.position.x - x;
          const dy = node.position.y - y;
          return Math.sqrt(dx * dx + dy * dy) < 10 / zoom;
        });

        setContextMenu({
          x: menuX,
          y: menuY,
          nodeId: clickedNode?.id,
        });
        return;
      }

      // Close context menu if clicking elsewhere
      if (contextMenu) {
        setContextMenu(null);
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - panOffset.x) / zoom;
      const y = (event.clientY - rect.top - panOffset.y) / zoom;

      if (state.ui.tool === "pan") {
        setIsPanning(true);
        setPanStart({
          x: event.clientX - panOffset.x,
          y: event.clientY - panOffset.y,
        });
        return;
      }

      // Check if clicking on a node
      const clickedNode = state.graph?.nodes.find((node) => {
        const dx = node.position.x - x;
        const dy = node.position.y - y;
        return Math.sqrt(dx * dx + dy * dy) < 10 / zoom;
      });

      if (clickedNode) {
        if (state.ui.tool === "select") {
          onNodeSelect(clickedNode.id);
          setIsDragging(true);
          setDragNode(clickedNode.id);
          setDragStart({
            x: x - clickedNode.position.x,
            y: y - clickedNode.position.y,
          });
        }
      } else if (state.ui.tool === "add-node") {
        onCanvasClick(x, y);
      }
    },
    [state, panOffset, zoom, onNodeSelect, onCanvasClick, contextMenu]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isPanning) {
        const newPanOffset = {
          x: event.clientX - panStart.x,
          y: event.clientY - panStart.y,
        };
        onPanChange(newPanOffset);
        return;
      }

      if (isDragging && dragNode) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - panOffset.x) / zoom;
        const y = (event.clientY - rect.top - panOffset.y) / zoom;

        // Update node position through context
        const node = state.graph?.nodes.find((n) => n.id === dragNode);
        if (node) {
          // Snap to grid if enabled
          let newX = x - dragStart.x;
          let newY = y - dragStart.y;

          if (state.ui.snapToGrid) {
            const gridSize = state.graph?.settings.gridSize || 20;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          // Update node position
          onNodeUpdate(dragNode, { position: { x: newX, y: newY } });
        }
      }
    },
    [
      isPanning,
      isDragging,
      dragNode,
      panOffset,
      zoom,
      panStart,
      dragStart,
      state,
      onNodeUpdate,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNode(null);
    setIsPanning(false);
    // Don't close context menu here - let it stay open until user clicks outside or selects an option
  }, []);

  const handleZoomIn = useCallback(() => {
    onZoomChange(Math.min(5, zoom * 1.2));
  }, [zoom, onZoomChange]);

  const handleZoomOut = useCallback(() => {
    onZoomChange(Math.max(0.1, zoom / 1.2));
  }, [zoom, onZoomChange]);

  const handleResetView = useCallback(() => {
    onZoomChange(1);
    onPanChange({ x: 0, y: 0 });
  }, [onZoomChange, onPanChange]);

  // Handle zoom
  const handleWheel = useCallback(
    (event: React.WheelEvent) => {
      event.preventDefault();
      const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
      onZoomChange(Math.max(0.1, Math.min(5, zoom * zoomFactor)));
    },
    [zoom, onZoomChange]
  );

  // Handle global click to close context menu
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (contextMenu) {
        const target = event.target as HTMLElement;
        // Close context menu if clicking outside of it
        if (!target.closest(".context-menu")) {
          setContextMenu(null);
        }
      }
    };

    if (contextMenu) {
      document.addEventListener("mousedown", handleGlobalClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleGlobalClick);
    };
  }, [contextMenu]);

  // Resize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      draw();
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => window.removeEventListener("resize", resizeCanvas);
  }, [draw]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()} // Prevent default context menu
        style={{ cursor: state.ui.tool === "pan" ? "grab" : "crosshair" }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu absolute bg-background border rounded-md shadow-lg py-1 z-50 min-w-48"
          style={{
            left: Math.min(contextMenu.x, window.innerWidth - 200), // Prevent overflow
            top: Math.min(contextMenu.y, window.innerHeight - 150),
          }}
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside menu
        >
          {contextMenu.nodeId ? (
            <>
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => {
                  onNodeSelect(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                Select Node
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => {
                  // Duplicate node
                  const node = state.graph?.nodes.find(
                    (n) => n.id === contextMenu.nodeId
                  );
                  if (node) {
                    const newNode = {
                      ...node,
                      id: `node_${Date.now()}`,
                      position: {
                        x: node.position.x + 50,
                        y: node.position.y + 50,
                        z: node.position.z,
                      },
                    };
                    addNode(newNode.position, newNode);
                  }
                  setContextMenu(null);
                }}
              >
                Duplicate Node
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm text-destructive"
                onClick={() => {
                  removeNode(contextMenu.nodeId!);
                  setContextMenu(null);
                }}
              >
                Delete Node
              </button>
            </>
          ) : (
            <>
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => {
                  // Convert screen coordinates to world coordinates
                  const canvas = canvasRef.current;
                  if (canvas) {
                    const rect = canvas.getBoundingClientRect();
                    const worldX = (contextMenu.x - panOffset.x) / zoom;
                    const worldY = (contextMenu.y - panOffset.y) / zoom;
                    onCanvasClick(worldX, worldY);
                  }
                  setContextMenu(null);
                }}
              >
                Add Node Here
              </button>
              <button
                className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
                onClick={() => {
                  onZoomChange(1);
                  onPanChange({ x: 0, y: 0 });
                  setContextMenu(null);
                }}
              >
                Reset View
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

// Panorama Viewer Component
function PanoramaViewer({
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
        // Use diagonal-based FOV to maintain scale invariance
        const diagonal = Math.sqrt(width * width + height * height);
        const referenceDiagonal = Math.sqrt(400 * 400 + 300 * 300); // Reference canvas diagonal
        const fovScale = Math.tan(fov / 2) * (referenceDiagonal / diagonal); // Inverse scaling
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

  useEffect(() => {
    drawPanorama();
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

      // Horizontal drag for yaw (left/right rotation)
      const newRotation =
        (dragStartRotation - deltaX * sensitivity + 360) % 360;

      // Vertical drag for pitch (up/down rotation), clamp to prevent flipping
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
          width={400}
          height={300}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp} // Stop dragging if mouse leaves canvas
        />
      </div>

      {/* Controls */}
      {selectedNode && (
        <div className="text-xs text-muted-foreground text-center">
          Drag horizontally to rotate view • Drag vertically to look up/down
        </div>
      )}

      {!selectedNode && (
        <div className="flex-1 flex items-center justify-center text-muted-foreground">
          Select a node to view panorama
        </div>
      )}
    </div>
  );
}

export function GraphCanvas({ pathPreview }: { pathPreview: string[] | null }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state,
    updateSettings,
    addNode,
    setSelectedNode,
    updateNode,
    deleteNode,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useGraph();

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPanOffset, setCanvasPanOffset] = useState({ x: 0, y: 0 });

  const handleToolChange = (tool: string) => {
    updateSettings({ tool } as any);
  };

  const handleZoomIn = useCallback(() => {
    setCanvasZoom((prev) => Math.min(5, prev * 1.2));
  }, []);

  const handleZoomOut = useCallback(() => {
    setCanvasZoom((prev) => Math.max(0.1, prev / 1.2));
  }, []);

  const handleResetView = useCallback(() => {
    setCanvasZoom(1);
    setCanvasPanOffset({ x: 0, y: 0 });
  }, []);

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (state.ui.tool === "add-node") {
        addNode({ x, y, z: 0 });
      }
    },
    [state.ui.tool, addNode]
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setSelectedNode(nodeId);
    },
    [setSelectedNode]
  );

  const handlePitchChange = useCallback(
    (pitch: number) => {
      if (state.ui.selectedNodeId) {
        updateNode(state.ui.selectedNodeId, { pitch });
      }
    },
    [state.ui.selectedNodeId, updateNode]
  );

  const handleRotationChange = useCallback(
    (rotation: number) => {
      if (state.ui.selectedNodeId) {
        updateNode(state.ui.selectedNodeId, { rotation });
      }
    },
    [state.ui.selectedNodeId, updateNode]
  );

  const selectedNode = state.graph?.nodes.find(
    (n) => n.id === state.ui.selectedNodeId
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Canvas Panel */}
      <ResizablePanel defaultSize={75} minSize={50}>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <div className="flex items-center gap-2 p-2 bg-background border-b">
            <Button
              variant={state.ui.tool === "select" ? "default" : "ghost"}
              size="sm"
              title="Select"
              onClick={() => handleToolChange("select")}
            >
              <MousePointer2 className="h-4 w-4" />
            </Button>
            <Button
              variant={state.ui.tool === "add-node" ? "default" : "ghost"}
              size="sm"
              title="Add Node"
              onClick={() => handleToolChange("add-node")}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
            <Button
              variant={state.ui.tool === "pan" ? "default" : "ghost"}
              size="sm"
              title="Pan"
              onClick={() => handleToolChange("pan")}
            >
              <Move className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-2" />

            <Button
              variant="ghost"
              size="sm"
              title="Zoom In"
              onClick={handleZoomIn}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Zoom Out"
              onClick={handleZoomOut}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              title="Reset View"
              onClick={handleResetView}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>

            <div className="h-6 w-px bg-border mx-2" />

            <Button
              variant="ghost"
              size="sm"
              disabled={!canUndo}
              onClick={undo}
              title="Undo"
            >
              ↶
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={!canRedo}
              onClick={redo}
              title="Redo"
            >
              ↷
            </Button>
          </div>

          {/* Canvas */}
          <div className="flex-1 bg-muted/10 overflow-hidden">
            <MapCanvas2D
              onNodeSelect={handleNodeSelect}
              onCanvasClick={handleCanvasClick}
              onNodeUpdate={updateNode}
              onToolChange={handleToolChange}
              zoom={canvasZoom}
              panOffset={canvasPanOffset}
              onZoomChange={setCanvasZoom}
              onPanChange={setCanvasPanOffset}
              addNode={addNode}
              removeNode={deleteNode}
              pathPreview={pathPreview}
            />
          </div>

          {/* Status Bar */}
          <div className="px-4 py-2 bg-background border-t text-xs text-muted-foreground">
            {state.graph?.nodes.length || 0} Nodes •{" "}
            {state.graph?.connections.length || 0} Connections • Tool:{" "}
            {state.ui.tool}
          </div>
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Panorama Viewer Panel */}
      <ResizablePanel defaultSize={25} minSize={20}>
        <div className="h-full bg-background border-l p-4">
          <h3 className="font-semibold mb-4">Panorama Viewer</h3>
          <PanoramaViewer
            selectedNode={selectedNode}
            onRotationChange={handleRotationChange}
            onPitchChange={handlePitchChange}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
