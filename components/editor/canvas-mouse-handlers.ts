"use client";

import { GraphNode } from "@/types/graph";

export interface MouseEventHandlers {
  handleMouseDown: (event: React.MouseEvent) => void;
  handleMouseMove: (event: React.MouseEvent) => void;
  handleMouseUp: () => void;
  handleWheel: (event: React.WheelEvent) => void;
}

export interface MouseHandlerParams {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: {
    graph: {
      nodes: GraphNode[];
      settings: { gridSize: number };
    } | null;
    ui: {
      tool: string;
      snapToGrid: boolean;
    };
  };
  panOffset: { x: number; y: number };
  zoom: number;
  onNodeSelect: (nodeId: string) => void;
  onCanvasClick: (x: number, y: number) => void;
  onNodeUpdate: (nodeId: string, updates: any) => void;
  onPanChange: (panOffset: { x: number; y: number }) => void;
  onZoomChange: (zoom: number) => void;
  contextMenu: { x: number; y: number; nodeId?: string } | null;
  setContextMenu: (
    menu: { x: number; y: number; nodeId?: string } | null
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
        // Only allow dragging if node is not locked
        if (!clickedNode.locked) {
          setIsDragging(true);
          setDragNode(clickedNode.id);
          setDragStart({
            x: x - clickedNode.position.x,
            y: y - clickedNode.position.y,
          });
        }
      }
    } else if (state.ui.tool === "add-node") {
      onCanvasClick(x, y);
    }
  };

  const handleMouseMove = (event: React.MouseEvent) => {
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
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragNode(null);
    setIsPanning(false);
  };

  const handleWheel = (event: React.WheelEvent) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 0.9 : 1.1;
    onZoomChange(Math.max(0.1, Math.min(5, zoom * zoomFactor)));
  };

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
  };
}
