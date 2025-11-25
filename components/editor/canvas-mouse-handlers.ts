"use client";

import { GraphNode, Area } from "@/types/graph";
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
      areas: Area[];
      settings: { gridSize: number };
      connections: any[];
    } | null;
    ui: {
      tool: string;
      snapToGrid: boolean;
      isConnecting?: boolean;
      connectingFromId?: string | null;
      isDrawingArea?: boolean;
      drawingAreaVertices?: BoundaryPoint[];
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
  contextMenu: {
    x: number;
    y: number;
    nodeId?: string;
    connectionId?: string;
    areaId?: string;
  } | null;
  setContextMenu: (
    menu: {
      x: number;
      y: number;
      nodeId?: string;
      connectionId?: string;
      areaId?: string;
    } | null
  ) => void;
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
  dragNode: string | null;
  setDragNode: (nodeId: string | null) => void;
  dragArea: string | null;
  setDragArea: (areaId: string | null) => void;
  dragStart: { x: number; y: number };
  setDragStart: (start: { x: number; y: number }) => void;
  isPanning: boolean;
  setIsPanning: (panning: boolean) => void;
  panStart: { x: number; y: number };
  setPanStart: (start: { x: number; y: number }) => void;
  hoveredNodeId: string | null;
  setHoveredNodeId: (nodeId: string | null) => void;
  hoveredAreaId: string | null;
  setHoveredAreaId: (areaId: string | null) => void;
  hoveredAreaVertex: { areaId: string; vertexIndex: number } | null;
  setHoveredAreaVertex: (
    vertex: { areaId: string; vertexIndex: number } | null
  ) => void;
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
    onAreaSelect,
    onAreaVertexUpdate,
    onAreaMove,
    onDrawingVertexAdd,
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
    onToolChange,
    isMiddleMousePanning,
    setIsMiddleMousePanning,
  } = params;

  // Extract drawing area vertices from state
  const drawingAreaVertices = state.ui.drawingAreaVertices || [];

  // Helper function to check if point is inside polygon
  const isPointInPolygon = (
    point: { x: number; y: number },
    polygon: { x: number; y: number }[]
  ): boolean => {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      if (
        polygon[i].y > point.y !== polygon[j].y > point.y &&
        point.x <
          ((polygon[j].x - polygon[i].x) * (point.y - polygon[i].y)) /
            (polygon[j].y - polygon[i].y) +
            polygon[i].x
      ) {
        inside = !inside;
      }
    }
    return inside;
  };

  // Helper function to find area at point
  const getAreaAtPoint = (x: number, y: number): Area | null => {
    if (!state.graph?.areas) return null;

    // Check areas in reverse order (top to bottom)
    for (let i = state.graph.areas.length - 1; i >= 0; i--) {
      const area = state.graph.areas[i];
      if (
        area.boundary.length >= 3 &&
        isPointInPolygon({ x, y }, area.boundary)
      ) {
        return area;
      }
    }
    return null;
  };

  // Helper function to find area vertex at point
  const getAreaVertexAtPoint = (
    x: number,
    y: number
  ): { area: Area; vertexIndex: number } | null => {
    if (!state.graph?.areas) return null;

    const tolerance = 12 / zoom;
    for (const area of state.graph.areas) {
      for (let i = 0; i < area.boundary.length; i++) {
        const vertex = area.boundary[i];
        const dx = vertex.x - x;
        const dy = vertex.y - y;
        if (Math.sqrt(dx * dx + dy * dy) < tolerance) {
          return { area, vertexIndex: i };
        }
      }
    }
    return null;
  };

  const handleMouseDown = (event: React.MouseEvent) => {
    // Handle right-click context menu
    if (event.button === 2) {
      event.preventDefault();

      // If drawing area and have enough vertices, finish drawing on right-click
      if (state.ui.tool === "draw-area" && drawingAreaVertices.length >= 3) {
        // Don't show context menu, just finish drawing
        return;
      }

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

      // Check if right-clicking on an area
      const clickedArea = clickedNode ? null : getAreaAtPoint(x, y);

      // Only check for connection if no node or area was found (prioritize nodes/areas over connections)
      const clickedConnection =
        clickedNode || clickedArea
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
        areaId: clickedArea?.id,
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

    // Check if clicking on an area vertex (for editing) - but skip if in add-node mode
    const clickedVertex =
      state.ui.tool === "add-node"
        ? null
        : clickedNode
        ? null
        : getAreaVertexAtPoint(x, y);

    // Check if clicking inside an area - but skip if in add-node mode or draw-area mode
    const clickedArea =
      state.ui.tool === "add-node" || state.ui.tool === "draw-area"
        ? null
        : clickedNode || clickedVertex
        ? null
        : getAreaAtPoint(x, y);

    if (clickedVertex) {
      // Handle area vertex dragging
      onAreaSelect?.(clickedVertex.area.id);
      setIsDragging(true);
      setDragNode(
        `area-vertex-${clickedVertex.area.id}-${clickedVertex.vertexIndex}`
      );
      setDragStart({
        x: x - clickedVertex.area.boundary[clickedVertex.vertexIndex].x,
        y: y - clickedVertex.area.boundary[clickedVertex.vertexIndex].y,
      });
    } else if (clickedArea) {
      // Handle area selection only in select mode
      if (state.ui.tool === "select") {
        onAreaSelect?.(clickedArea.id);
      }

      // Start area dragging if in move mode
      if (state.ui.tool === "move") {
        setIsDragging(true);
        setDragArea(clickedArea.id);
        // Store the initial offset from mouse to area center (like node dragging)
        const centerX =
          clickedArea.boundary.reduce((sum, p) => sum + p.x, 0) /
          clickedArea.boundary.length;
        const centerY =
          clickedArea.boundary.reduce((sum, p) => sum + p.y, 0) /
          clickedArea.boundary.length;
        setDragStart({
          x: x - centerX,
          y: y - centerY,
        });
      }
    } else if (clickedNode) {
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
    } else if (state.ui.tool === "draw-area") {
      // Check if clicking near the first vertex to close the polygon
      if (drawingAreaVertices.length >= 3) {
        const firstVertex = drawingAreaVertices[0];
        const distance = Math.sqrt(
          Math.pow(x - firstVertex.x, 2) + Math.pow(y - firstVertex.y, 2)
        );

        if (distance < 20 / zoom) {
          // Close the polygon - don't add a new vertex, just finish drawing
          // The area creation panel will handle the creation
          return;
        }
      }

      // Handle area drawing - add new vertex
      onDrawingVertexAdd?.({ x, y });
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

    // Detect hovered area
    const hoveredArea = hoveredNode ? null : getAreaAtPoint(x, y);

    // Detect hovered area vertex (for selected areas)
    const hoveredVertex = hoveredArea ? getAreaVertexAtPoint(x, y) : null;

    // Update hover state
    if (hoveredNode) {
      if (hoveredNodeId !== hoveredNode.id) {
        setHoveredNodeId(hoveredNode.id);
      }
      if (hoveredAreaId !== null) {
        setHoveredAreaId(null);
      }
      if (hoveredAreaVertex !== null) {
        setHoveredAreaVertex(null);
      }
    } else if (hoveredVertex) {
      if (
        hoveredAreaVertex?.areaId !== hoveredVertex.area.id ||
        hoveredAreaVertex?.vertexIndex !== hoveredVertex.vertexIndex
      ) {
        setHoveredAreaVertex({
          areaId: hoveredVertex.area.id,
          vertexIndex: hoveredVertex.vertexIndex,
        });
      }
      if (hoveredAreaId !== hoveredVertex.area.id) {
        setHoveredAreaId(hoveredVertex.area.id);
      }
      if (hoveredNodeId !== null) {
        setHoveredNodeId(null);
      }
    } else if (hoveredArea) {
      if (hoveredAreaId !== hoveredArea.id) {
        setHoveredAreaId(hoveredArea.id);
      }
      if (hoveredNodeId !== null) {
        setHoveredNodeId(null);
      }
      if (hoveredAreaVertex !== null) {
        setHoveredAreaVertex(null);
      }
    } else {
      if (hoveredNodeId !== null) {
        setHoveredNodeId(null);
      }
      if (hoveredAreaId !== null) {
        setHoveredAreaId(null);
      }
      if (hoveredAreaVertex !== null) {
        setHoveredAreaVertex(null);
      }
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
    if (isDragging && (dragNode || dragArea)) {
      if (dragNode && dragNode.startsWith("area-vertex-")) {
        // Handle area vertex dragging
        const parts = dragNode.split("-");
        const areaId = parts[2];
        const vertexIndex = parseInt(parts[3]);

        const area = state.graph?.areas.find((a) => a.id === areaId);
        if (area) {
          // Calculate new position
          let newX = x - dragStart.x;
          let newY = y - dragStart.y;

          // Snap to grid if enabled
          if (state.ui.snapToGrid) {
            const gridSize = state.graph?.settings.gridSize || 20;
            newX = Math.round(newX / gridSize) * gridSize;
            newY = Math.round(newY / gridSize) * gridSize;
          }

          // Update area vertex position
          onAreaVertexUpdate?.(areaId, vertexIndex, { x: newX, y: newY }, true);
        }
      } else if (dragArea) {
        // Handle area dragging (moving entire area) - simplified like node dragging
        const area = state.graph?.areas.find((a) => a.id === dragArea);
        if (area) {
          // Calculate new center position (like node dragging: mouse - offset)
          let newCenterX = x - dragStart.x;
          let newCenterY = y - dragStart.y;

          // Snap to grid if enabled
          if (state.ui.snapToGrid) {
            const gridSize = state.graph?.settings.gridSize || 20;
            newCenterX = Math.round(newCenterX / gridSize) * gridSize;
            newCenterY = Math.round(newCenterY / gridSize) * gridSize;
          }

          // Calculate delta from current area center to new center
          const currentCenterX =
            area.boundary.reduce((sum, p) => sum + p.x, 0) /
            area.boundary.length;
          const currentCenterY =
            area.boundary.reduce((sum, p) => sum + p.y, 0) /
            area.boundary.length;

          const deltaX = newCenterX - currentCenterX;
          const deltaY = newCenterY - currentCenterY;

          // Move entire area by delta
          onAreaMove?.(dragArea, { x: deltaX, y: deltaY }, true);
        }
      } else {
        // Handle node dragging
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
    }
  };

  const handleMouseUp = () => {
    // If we were dragging something, sync final state with backend
    if (isDragging) {
      if (dragNode && dragNode.startsWith("area-vertex-")) {
        // Sync area vertex changes to backend
        const parts = dragNode.split("-");
        const areaId = parts[2];
        const vertexIndex = parseInt(parts[3]);
        const area = state.graph?.areas.find((a) => a.id === areaId);
        if (area) {
          onAreaVertexUpdate?.(
            areaId,
            vertexIndex,
            area.boundary[vertexIndex],
            false
          );
        }
      } else if (dragArea) {
        // Area moving is already handled in real-time during drag
        // Just sync the final position to backend
        onAreaMove?.(dragArea, { x: 0, y: 0 }, false);
      } else if (dragNode) {
        // Handle node dragging final sync
        const node = state.graph?.nodes.find((n) => n.id === dragNode);
        if (node) {
          // Get current position from the node (already updated during dragging)
          const finalPosition = node.position;

          // Sync with backend (isDragging = false to trigger API call)
          onNodeUpdate(dragNode, { position: finalPosition }, false);
        }
      }
    }

    setIsDragging(false);
    setDragNode(null);
    setDragArea(null);
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
