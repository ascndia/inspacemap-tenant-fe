"use client";

import { GraphNode } from "@/types/graph";
import { getConnectionAtPoint } from "./canvas-drawing";

export interface MouseEventHandlers {
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (event: React.WheelEvent) => void;
  handleMouseEnter: () => void;
  handleMouseLeave: () => void;
}

export interface MouseHandlerParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: {
    graph: {
      nodes: GraphNode[];
      settings: { gridSize: number };
      connections: any[];
    } | null;
    ui: {
      tool: string;
      snapToGrid: boolean;
      isConnecting?: boolean;
      connectingFromId?: string | null;
    };
  };
  panOffset: { x: number; y: number };
  zoom: number;
  onNodeSelect: (nodeId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeUpdate: (nodeId: string, updates: any, isDragging?: boolean) => void;
  onPanChange: (panOffset: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  onConnectionStart?: (nodeId: string) => void;
  onConnectionComplete?: (fromNodeId: string, toNodeId: string) => void;
  contextMenu: {
    x: number;
    y: number;
    nodeId?: string;
    connectionId?: string;
  } | null;
  setContextMenu: (
    menu: {
      x: number;
      y: number;
      nodeId?: string;
      connectionId?: string;
    } | null
  ) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragNode: string | null;
  setDragNode: (nodeId: string | null) => void;
  dragStart: { x: number; y: number };
  setDragStart: (start: { x: number; y: number }) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  panStart: { x: number; y: number };
  setPanStart: (start: { x: number; y: number }) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (nodeId: string | null) => void;
  mousePosition: { x: number; y: number };
  setMousePosition: (position: { x: number; y: number }) => void;
  onToolChange?: (tool: string) => void;
  isMiddleMousePanning: boolean;
  setIsMiddleMousePanning: (panning: boolean) => void;
}

export function createMouseHandlers(
  params: MouseHandlerParams
): MouseEventHandlers {
  const {
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
    onToolChange,
    isMiddleMousePanning,
    setIsMiddleMousePanning,
  } = params;

  const handleMouseDown = (event: React.MouseEvent) => {
    // Handle right-click context menu
    if (event.button === 2) {
      event.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Get canvas container position (should have position: relative)
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

      // Only check for connection if no node was found (prioritize nodes over connections)
      const clickedConnection = clickedNode
        ? null
        : state.graph?.connections
        ? getConnectionAtPoint(
            x,
            y,
            state.graph.connections,
            state.graph.nodes,
            5 / zoom
          )
        : null;

      setContextMenu({
        x: menuX,
        y: menuY,
        nodeId: clickedNode?.id,
        connectionId: clickedConnection?.id,
      });
      return;
    }

    // Handle middle mouse button for panning
    if (event.button === 1) {
      event.preventDefault();
      setIsMiddleMousePanning(true);
      setPanStart({
        x: event.clientX - panOffset.x,
        y: event.clientY - panOffset.y,
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
        // In select mode, only select the node, don't start dragging
        onNodeSelect(clickedNode.id);
      } else if (state.ui.tool === "move") {
        // In move mode, select and start dragging if node is not locked
        onNodeSelect(clickedNode.id);
        if (!clickedNode.locked) {
          setIsDragging(true);
          setDragNode(clickedNode.id);
          setDragStart({
            x: x - clickedNode.position.x,
            y: y - clickedNode.position.y,
          });
        }
      } else if (state.ui.tool === "connect") {
        // Handle connection creation
        if (state.ui.isConnecting && state.ui.connectingFromId) {
          // Complete connection
          if (state.ui.connectingFromId !== clickedNode.id) {
            onConnectionComplete?.(state.ui.connectingFromId, clickedNode.id);
          }
        } else {
          // Start connection
          onConnectionStart?.(clickedNode.id);
        }
      }
    } else if (state.ui.tool === "add-node") {
      onCanvasClick(x, y);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - panOffset.x) / zoom;
    const y = (event.clientY - rect.top - panOffset.y) / zoom;

    // Update mouse position for connection preview
    setMousePosition({ x, y });

    // Detect hovered node
    const hoveredNode = state.graph?.nodes.find((node) => {
      const dx = node.position.x - x;
      const dy = node.position.y - y;
      return Math.sqrt(dx * dx + dy * dy) < 10 / zoom;
    });

    // Update hover state
    if (hoveredNode) {
      if (hoveredNodeId !== hoveredNode.id) {
        setHoveredNodeId(hoveredNode.id);
      }
    } else if (hoveredNodeId !== null) {
      setHoveredNodeId(null);
    }

    // Handle middle mouse panning
    if (isMiddleMousePanning) {
      const newPanOffset = {
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      };
      onPanChange(newPanOffset);
      return;
    }

    if (isPanning) {
      const newPanOffset = {
        x: event.clientX - panStart.x,
        y: event.clientY - panStart.y,
      };
      onPanChange(newPanOffset);
      return;
    }

    // Handle node dragging for real-time visual feedback
    if (isDragging && dragNode) {
      const node = state.graph?.nodes.find((n) => n.id === dragNode);
      if (node && !node.locked) {
        // Calculate new position
        let newX = x - dragStart.x;
        let newY = y - dragStart.y;

        // Snap to grid if enabled
        if (state.ui.snapToGrid) {
          const gridSize = state.graph?.settings.gridSize || 20;
          newX = Math.round(newX / gridSize) * gridSize;
          newY = Math.round(newY / gridSize) * gridSize;
        }

        // Update node position in real-time for visual feedback (isDragging = true)
        onNodeUpdate(dragNode, { position: { x: newX, y: newY } }, true);
      }
    }
  };

  const handleMouseUp = () => {
    // If we were dragging a node, sync final position with backend
    if (isDragging && dragNode) {
      const node = state.graph?.nodes.find((n) => n.id === dragNode);
      if (node) {
        // Get current position from the node (already updated during dragging)
        const finalPosition = node.position;

        // Sync with backend (isDragging = false to trigger API call)
        onNodeUpdate(dragNode, { position: finalPosition }, false);
      }
    }

    setIsDragging(false);
    setDragNode(null);
    setIsPanning(false);
    setIsMiddleMousePanning(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    // Prevent default browser zoom behavior
    event.preventDefault();
    event.stopPropagation();

    // Only handle zoom if Ctrl is not pressed (to avoid interfering with browser zoom)
    // Actually, we want to prevent browser zoom, so we'll handle it regardless
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    // Calculate world coordinates under mouse before zoom
    const worldX = (mouseX - panOffset.x) / zoom;
    const worldY = (mouseY - panOffset.y) / zoom;

    // Calculate new zoom
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, zoom * zoomFactor));

    // Adjust pan so mouse stays over the same world point
    const newPanX = mouseX - worldX * newZoom;
    const newPanY = mouseY - worldY * newZoom;

    onZoomChange(newZoom);
    onPanChange({ x: newPanX, y: newPanY });
  };

  const handleMouseEnter = () => {
    // Reset hover state when mouse enters canvas
    setHoveredNodeId(null);
  };

  const handleMouseLeave = () => {
    // Reset hover state when mouse leaves canvas
    setHoveredNodeId(null);
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleMouseEnter,
    handleMouseLeave,
  };
}
