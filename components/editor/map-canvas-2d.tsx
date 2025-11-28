"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGraphStore } from "@/stores/graph-store";
import { drawCanvas } from "./canvas-drawing";
import { createMouseHandlers } from "./canvas-mouse-handlers";
import { CanvasContextMenu } from "./canvas-context-menu";
import { mediaService } from "@/lib/services/media-service";
import { MediaItem } from "@/types/media";
import { MediaPicker } from "@/components/media/media-picker";

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
  onConnectionCancel?: () => void;
  onDeleteConnection?: (connectionId: string) => void;
  onAreaSelect?: (areaId: string) => void;
  onAreaVertexUpdate?: (
    areaId: string,
    vertexIndex: number,
    position: { x: number; y: number },
    isDragging?: boolean
  ) => void;
  onAreaMove?: (
    areaId: string,
    delta: { x: number; y: number },
    isDragging?: boolean
  ) => void;
  onDrawingVertexAdd?: (position: { x: number; y: number }) => void;
  onDrawingCancel?: () => void;
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
  onConnectionCancel,
  onDeleteConnection,
  onAreaSelect,
  onAreaVertexUpdate,
  onAreaMove,
  onDrawingVertexAdd,
  onDrawingCancel,
}: MapCanvas2DProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const graphStore = useGraphStore();
  const [floorplanImage, setFloorplanImage] = useState<HTMLImageElement | null>(
    null
  );

  // Extract values from store
  const {
    graph,
    selectedNodeId,
    tool,
    isConnecting,
    connectingFromId,
    selectedAreaId,
    isDrawingArea,
    drawingAreaVertices,
  } = graphStore;

  const [isDragging, setIsDragging] = useState(false);
  const [dragNode, setDragNode] = useState<string | null>(null);
  const [dragArea, setDragArea] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isMiddleMousePanning, setIsMiddleMousePanning] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId?: string;
    connectionId?: string;
  } | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [panoramaMedia, setPanoramaMedia] = useState<MediaItem[]>([]);
  const [loadingPanoramaMedia, setLoadingPanoramaMedia] = useState(false);
  const [showPanoramaPicker, setShowPanoramaPicker] = useState(false);
  const [panoramaPickerTarget, setPanoramaPickerTarget] = useState<{
    type: "set" | "add";
    nodeId?: string;
    position?: { x: number; y: number };
  } | null>(null);
  const [hoveredAreaId, setHoveredAreaId] = useState<string | null>(null);
  const [hoveredAreaVertex, setHoveredAreaVertex] = useState<{
    areaId: string;
    vertexIndex: number;
  } | null>(null);

  // Load panorama media
  useEffect(() => {
    const loadPanoramaMedia = async () => {
      try {
        setLoadingPanoramaMedia(true);
        const response = await mediaService.getMedia();
        const panoramas = response.data.filter(
          (item: MediaItem) => item.category === "panorama"
        );
        setPanoramaMedia(panoramas);
      } catch (error) {
        console.error("Failed to load panorama media:", error);
      } finally {
        setLoadingPanoramaMedia(false);
      }
    };

    loadPanoramaMedia();
  }, []);

  // Load floorplan image when floorplan data changes
  useEffect(() => {
    if (graph?.floorplan?.fileUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous"; // Allow canvas operations
      img.onload = () => {
        setFloorplanImage(img);
      };
      img.onerror = () => {
        console.error("Failed to load floorplan image");
        setFloorplanImage(null);
      };
      img.src = graph.floorplan.fileUrl;
    } else {
      setFloorplanImage(null);
    }
  }, [graph?.floorplan?.fileUrl]);

  // Draw function
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Don't draw if graph is not loaded yet
    if (!graph) return;

    drawCanvas({
      ctx,
      canvas,
      panOffset,
      zoom,
      floorplanImage,
      graph,
      ui: {
        showGrid: graph?.settings.showGrid ?? true,
        selectedNodeId,
        selectedAreaId,
        isConnecting,
        connectingFromId,
        hoveredNodeId,
        hoveredAreaId,
        hoveredAreaVertex,
        mousePosition,
        isDrawingArea,
        drawingAreaVertices,
        draggingAreaId: dragArea,
      },
      pathPreview,
    });
  }, [
    graph,
    panOffset,
    zoom,
    pathPreview,
    floorplanImage,
    selectedNodeId,
    hoveredNodeId,
    mousePosition,
  ]);

  // Create mouse handlers
  const mouseHandlers = createMouseHandlers({
    canvasRef,
    state: {
      graph,
      ui: {
        tool,
        snapToGrid: graph?.settings.snapToGrid ?? true,
        isConnecting,
        connectingFromId,
        isDrawingArea,
        drawingAreaVertices,
      },
    },
    panOffset,
    zoom,
    onNodeSelect,
    onCanvasClick,
    onNodeUpdate,
    onPanChange,
    onZoomChange,
    onConnectionStart,
    onConnectionComplete,
    onConnectionCancel,
    onAreaSelect,
    onAreaVertexUpdate,
    onAreaMove,
    onDrawingVertexAdd,
    onDrawingCancel,
    contextMenu,
    setContextMenu,
    isDragging,
    setIsDragging,
    dragNode,
    setDragNode,
    dragArea,
    setDragArea,
    dragStart,
    setDragStart,
    isPanning,
    setIsPanning,
    panStart,
    setPanStart,
    hoveredNodeId,
    setHoveredNodeId,
    hoveredAreaId,
    setHoveredAreaId,
    hoveredAreaVertex,
    setHoveredAreaVertex,
    mousePosition,
    setMousePosition,
    isMiddleMousePanning,
    setIsMiddleMousePanning,
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
      const node = graph?.nodes.find((n) => n.id === nodeId);
      if (node) {
        onNodeUpdate(nodeId, { locked: !node.locked });
      }
      setContextMenu(null);
    },
    [graph?.nodes, onNodeUpdate]
  );

  const handleDuplicateNode = useCallback(
    (nodeId: string) => {
      const node = graph?.nodes.find((n) => n.id === nodeId);
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
    [graph?.nodes, addNode]
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
    if (graph?.floorplan && canvasRef.current) {
      // Recenter the floorplan
      const canvas = canvasRef.current;
      const canvasRect = canvas.getBoundingClientRect();
      const floorplan = graph.floorplan;

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
  }, [graph?.floorplan, onZoomChange, onPanChange]);

  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      onDeleteConnection?.(connectionId);
      setContextMenu(null);
    },
    [onDeleteConnection]
  );

  const handleAddNodeWithPanorama = useCallback((x: number, y: number) => {
    // Open media picker dialog for selecting panorama
    setPanoramaPickerTarget({
      type: "add",
      position: { x, y },
    });
    setShowPanoramaPicker(true);
    setContextMenu(null);
  }, []);

  const handleSetPanorama = useCallback((nodeId: string) => {
    // Open media picker dialog for selecting panorama
    setPanoramaPickerTarget({
      type: "set",
      nodeId,
    });
    setShowPanoramaPicker(true);
    setContextMenu(null);
  }, []);

  const handlePanoramaSelected = useCallback(
    (media: MediaItem) => {
      if (!panoramaPickerTarget) return;

      if (
        panoramaPickerTarget.type === "add" &&
        panoramaPickerTarget.position
      ) {
        // Add new node with selected panorama
        const canvas = canvasRef.current;
        if (canvas) {
          const { x, y } = panoramaPickerTarget.position;
          const worldX = (x - panOffset.x) / zoom;
          const worldY = (y - panOffset.y) / zoom;

          addNode(
            { x: worldX, y: worldY, z: 0 },
            {
              panorama_asset_id: media.asset_id,
              panorama_url: media.url,
            }
          );
        }
      } else if (
        panoramaPickerTarget.type === "set" &&
        panoramaPickerTarget.nodeId
      ) {
        // Update existing node with selected panorama
        onNodeUpdate(panoramaPickerTarget.nodeId, {
          panorama_asset_id: media.asset_id,
          panorama_url: media.url,
        });
      }

      // Reset picker state
      setShowPanoramaPicker(false);
      setPanoramaPickerTarget(null);
    },
    [panoramaPickerTarget, panOffset, zoom, addNode, onNodeUpdate]
  );

  return (
    <>
      <canvas
        ref={canvasRef}
        className="w-full h-full cursor-crosshair"
        onMouseDown={mouseHandlers.handleMouseDown}
        onMouseMove={mouseHandlers.handleMouseMove}
        onMouseUp={mouseHandlers.handleMouseUp}
        onMouseEnter={mouseHandlers.handleMouseEnter}
        onMouseLeave={mouseHandlers.handleMouseLeave}
        onWheel={mouseHandlers.handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        style={{ cursor: tool === "pan" ? "grab" : "crosshair" }}
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
          onAddNodeWithPanorama={handleAddNodeWithPanorama}
          onResetView={handleResetView}
          onDeleteConnection={handleDeleteConnection}
          onSetPanorama={handleSetPanorama}
          isNodeLocked={
            graph?.nodes.find((n) => n.id === contextMenu.nodeId)?.locked
          }
          hasPanorama={
            !!graph?.nodes.find((n) => n.id === contextMenu.nodeId)
              ?.panorama_url ||
            !!graph?.nodes.find((n) => n.id === contextMenu.nodeId)
              ?.panorama_asset_id
          }
        />
      )}

      {/* Panorama Media Picker */}
      <MediaPicker
        open={showPanoramaPicker}
        onOpenChange={setShowPanoramaPicker}
        onSelect={handlePanoramaSelected}
        acceptTypes={["image"]}
        trigger={null}
      />
    </>
  );
}
