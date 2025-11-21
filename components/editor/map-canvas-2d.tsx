"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGraph } from "@/contexts/graph-context";
import { drawCanvas } from "./canvas-drawing";
import { createMouseHandlers } from "./canvas-mouse-handlers";
import { CanvasContextMenu } from "./canvas-context-menu";

interface MapCanvas2DProps {
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
  onConnectionStart?: (nodeId: string) => void;
  onConnectionComplete?: (fromNodeId: string, toNodeId: string) => void;
  onDeleteConnection?: (connectionId: string) => void;
}

export function MapCanvas2D({
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
  onConnectionStart,
  onConnectionComplete,
  onDeleteConnection,
}: MapCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { state, loadFloorplan } = useGraph();
  const [floorplanImage, setFloorplanImage] = useState<HTMLImageElement | null>(
    null
  );

  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
    connectionId?: string;
  } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Load floorplan image when floorplan data changes
  useEffect(() => {
    if (state.graph?.floorplan?.fileUrl) {
      const img = new Image();
      img.onload = () => {
        setFloorplanImage(img);
      };
      img.onerror = () => {
        console.error("Failed to load floorplan image");
        setFloorplanImage(null);
      };
      img.src = state.graph.floorplan.fileUrl;
    } else {
      setFloorplanImage(null);
    }
  }, [state.graph?.floorplan?.fileUrl]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    drawCanvas({
      ctx,
      canvas,
      panOffset,
      zoom,
      floorplanImage,
      graph: state.graph!,
      ui: {
        showGrid: state.ui.showGrid,
        selectedNodeId: state.ui.selectedNodeId,
        isConnecting: state.ui.isConnecting,
        connectingFromId: state.ui.connectingFromId,
        hoveredNodeId,
        mousePosition,
      },
      pathPreview,
    });
  }, [
    state,
    panOffset,
    zoom,
    pathPreview,
    floorplanImage,
    hoveredNodeId,
    mousePosition,
  ]);

  // Create mouse handlers
  const mouseHandlers = createMouseHandlers({
    canvasRef,
    state,
    panOffset,
    zoom,
    onNodeSelect,
    onCanvasClick,
    onNodeUpdate,
    onPanChange,
    onZoomChange,
    onConnectionStart,
    onConnectionComplete,
    contextMenu,
    setContextMenu,
    isDragging,
    setIsDragging,
    dragNode,
    setDragNode,
    dragStart,
    setDragStart,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    hoveredNodeId,
    setHoveredNodeId,
    mousePosition,
    setMousePosition,
  });

  // Handle global click to close context menu
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
      if (contextMenu) {
        const target = event.target as HTMLElement;
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

  // Context menu handlers
  const handleSelectNode = useCallback(
    (nodeId: string) => {
      onNodeSelect(nodeId);
      setContextMenu(null);
    },
    [onNodeSelect]
  );

  const handleToggleLock = useCallback(
    (nodeId: string) => {
      const node = state.graph?.nodes.find((n) => n.id === nodeId);
      if (node) {
        onNodeUpdate(nodeId, { locked: !node.locked });
      }
      setContextMenu(null);
    },
    [state.graph?.nodes, onNodeUpdate]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const node = state.graph?.nodes.find((n) => n.id === nodeId);
      if (node) {
        const newNode = {
          ...node,
          id: `node_${Date.now()}`,
          position: {
            x: node.position.x + 50,
            y: node.position.y + 50,
            z: node.position.z,
          },
          locked: false,
        };
        addNode(newNode.position, newNode);
      }
      setContextMenu(null);
    },
    [state.graph?.nodes, addNode]
  );

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      removeNode(nodeId);
      setContextMenu(null);
    },
    [removeNode]
  );

  const handleAddNode = useCallback(
    (x: number, y: number) => {
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const worldX = (x - panOffset.x) / zoom;
        const worldY = (y - panOffset.y) / zoom;
        onCanvasClick(worldX, worldY);
      }
      setContextMenu(null);
    },
    [panOffset, zoom, onCanvasClick]
  );

  const handleResetView = useCallback(() => {
    if (state.graph?.floorplan && canvasRef.current) {
      // Recenter the floorplan
      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      const floorplan = state.graph.floorplan;

      // Calculate floorplan center
      const floorplanCenterX =
        (floorplan.bounds.minX + floorplan.bounds.maxX) / 2;
      const floorplanCenterY =
        (floorplan.bounds.minY + floorplan.bounds.maxY) / 2;

      // Calculate floorplan dimensions
      const floorplanWidth = floorplan.bounds.maxX - floorplan.bounds.minX;
      const floorplanHeight = floorplan.bounds.maxY - floorplan.bounds.minY;

      // Calculate zoom to fit floorplan in viewport with some padding
      const padding = 0.8;
      const zoomX = (canvasRect.width * padding) / floorplanWidth;
      const zoomY = (canvasRect.height * padding) / floorplanHeight;
      const fitZoom = Math.min(zoomX, zoomY, 2);

      // Calculate pan offset to center the floorplan
      const centerX = canvasRect.width / 2;
      const centerY = canvasRect.height / 2;
      const panX = centerX - floorplanCenterX * fitZoom;
      const panY = centerY - floorplanCenterY * fitZoom;

      onZoomChange(Math.max(0.1, fitZoom));
      onPanChange({ x: panX, y: panY });
    } else {
      // Fallback to default reset if no floorplan
      onZoomChange(1);
      onPanChange({ x: 0, y: 0 });
    }
    setContextMenu(null);
  }, [state.graph?.floorplan, onZoomChange, onPanChange]);

  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      onDeleteConnection?.(connectionId);
      setContextMenu(null);
    },
    [onDeleteConnection]
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={mouseHandlers.handleMouseDown}
        onMouseMove={mouseHandlers.handleMouseMove}
        onMouseUp={mouseHandlers.handleMouseUp}
        onWheel={mouseHandlers.handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: state.ui.tool === "pan" ? "grab" : "crosshair" }}
      />

      {/* Context Menu */}
      {contextMenu && (
        <CanvasContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          nodeId={contextMenu.nodeId}
          connectionId={contextMenu.connectionId}
          onSelectNode={handleSelectNode}
          onToggleLock={handleToggleLock}
          onDuplicateNode={handleDuplicateNode}
          onDeleteNode={handleDeleteNode}
          onAddNode={handleAddNode}
          onResetView={handleResetView}
          onDeleteConnection={handleDeleteConnection}
          isNodeLocked={
            state.graph?.nodes.find((n) => n.id === contextMenu.nodeId)?.locked
          }
        />
      )}
    </>
  );
}
