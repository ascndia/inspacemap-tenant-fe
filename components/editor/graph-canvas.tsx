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

// 2D Canvas Component for Map Editing
function MapCanvas2D({
  onNodeSelect,
  onCanvasClick,
  pathPreview,
}: {
  onNodeSelect: (nodeId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  pathPreview: string[] | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state } = useGraph();

  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

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
    [state, panOffset, zoom, onNodeSelect, onCanvasClick]
  );

  const handleMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (isPanning) {
        setPanOffset({
          x: event.clientX - panStart.x,
          y: event.clientY - panStart.y,
        });
        return;
      }

      if (isDragging && dragNode) {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = (event.clientX - rect.left - panOffset.x) / zoom;
        const y = (event.clientY - rect.top - panOffset.y) / zoom;

        // Update node position (this will be handled by context)
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

          // Update node position through context
          // This will be implemented in the parent component
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
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragNode(null);
    setIsPanning(false);
  }, []);

  // Handle zoom
  const handleWheel = useCallback((event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.max(0.1, Math.min(5, prev * zoomFactor)));
  }, []);

  // Redraw when dependencies change
  useEffect(() => {
    draw();
  }, [draw]);

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
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: state.ui.tool === "pan" ? "grab" : "crosshair" }}
    />
  );
}

// Panorama Viewer Component
function PanoramaViewer({
  selectedNode,
  onRotationChange,
}: {
  selectedNode: any;
  onRotationChange: (rotation: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rotation, setRotation] = useState(0);
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
  }, [selectedNode]);

  // Draw equirectangular panorama
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
      // Draw placeholder
      ctx.fillStyle = "#f0f0f0";
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = "#666";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No panorama image", width / 2, height / 2);
      return;
    }

    // Draw equirectangular view with rotation
    const imageWidth = image.width;
    const imageHeight = image.height;

    // Calculate visible portion based on rotation
    const rotationRad = (rotation * Math.PI) / 180;
    const fov = 90; // Field of view in degrees
    const fovRad = (fov * Math.PI) / 180;

    // For simplicity, we'll just draw a portion of the equirectangular image
    const startX = ((rotation / 360) * imageWidth + imageWidth) % imageWidth;
    const drawWidth = (fov / 360) * imageWidth;

    ctx.drawImage(
      image,
      startX,
      0,
      drawWidth,
      imageHeight,
      0,
      0,
      width,
      height
    );

    // If we need to wrap around
    if (startX + drawWidth > imageWidth) {
      ctx.drawImage(
        image,
        0,
        0,
        startX + drawWidth - imageWidth,
        imageHeight,
        width - ((startX + drawWidth - imageWidth) / drawWidth) * width,
        0,
        ((startX + drawWidth - imageWidth) / drawWidth) * width,
        height
      );
    }

    // Draw rotation indicator
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(width / 2, height / 2 - 20);
    ctx.lineTo(width / 2, height / 2 + 20);
    ctx.stroke();

    ctx.fillStyle = "#fff";
    ctx.font = "12px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`${rotation}°`, width / 2, height / 2 + 35);
  }, [image, rotation]);

  useEffect(() => {
    if (selectedNode) {
      setRotation(selectedNode.rotation || 0);
    }
  }, [selectedNode]);

  useEffect(() => {
    drawPanorama();
  }, [drawPanorama]);

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
          className="w-full h-full"
          width={400}
          height={300}
        />
      </div>

      {/* Controls */}
      {selectedNode && (
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Rotation: {rotation}°</label>
            <input
              type="range"
              min="0"
              max="360"
              value={rotation}
              onChange={(e) => handleRotationChange(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotationChange((rotation - 45 + 360) % 360)}
            >
              ← 45°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleRotationChange((rotation + 45) % 360)}
            >
              45° →
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            Adjust rotation to align "North" with the top of the map
          </div>
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
    undo,
    redo,
    canUndo,
    canRedo,
  } = useGraph();

  const handleToolChange = (tool: string) => {
    updateSettings({ tool } as any);
  };

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
    <div className="flex h-full gap-4">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
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

          <Button variant="ghost" size="sm" title="Zoom In">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Zoom Out">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" title="Reset View">
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

      {/* Panorama Viewer Panel */}
      <div className="w-80 bg-background border-l p-4">
        <h3 className="font-semibold mb-4">Panorama Viewer</h3>
        <PanoramaViewer
          selectedNode={selectedNode}
          onRotationChange={handleRotationChange}
        />
      </div>
    </div>
  );
}
