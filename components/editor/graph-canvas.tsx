"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useGraph } from "@/providers/GraphProvider";
import { useGraphStore } from "@/stores/graph-store";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { CanvasToolbar } from "./canvas-toolbar";
import { MapCanvas2D } from "./map-canvas-2d";
import PanoramaViewer from "./panorama-viewer2";
import { AreaCreationPanel } from "./area-creation-panel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

interface GraphCanvasProps {
  showPropertiesPanel: boolean;
  onShowPropertiesPanelChange: (show: boolean) => void;
  showAreaPanel: boolean;
  onShowAreaPanelChange: (show: boolean) => void;
  pathPreview: string[] | null;
}
export function GraphCanvas({
  showPropertiesPanel,
  onShowPropertiesPanelChange,
  showAreaPanel,
  onShowAreaPanelChange,
  pathPreview,
}: GraphCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const graphStore = useGraphStore();
  const graphProvider = useGraph();

  // Extract values from store
  const {
    graph,
    selectedNodeId,
    selectedConnectionId,
    selectedAreaId,
    tool,
    zoom,
    panOffset,
    showPanoramaViewer,
    panoramaNodeId,
    panoramaYaw,
    panoramaPitch,
    isLoading,
    error,
    isDrawingArea,
    drawingAreaVertices,
  } = graphStore;

  // Extract functions from GraphProvider (with React Query integration)
  const {
    addNode,
    deleteNode,
    updateNode,
    addConnection,
    deleteConnection,
    setSelectedNode,
    setTool,
    setZoom,
    setPanOffset,
    togglePanoramaViewer,
    setPanoramaNode,
  } = graphProvider;

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPanOffset, setCanvasPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [showUnsavedAreaDialog, setShowUnsavedAreaDialog] = useState(false);
  const [pendingToolChange, setPendingToolChange] = useState<string | null>(
    null
  );

  // Auto-show panorama viewer when panorama node is set
  useEffect(() => {
    if (panoramaNodeId && !showPanoramaViewer) {
      togglePanoramaViewer();
    }
  }, [panoramaNodeId, showPanoramaViewer, togglePanoramaViewer]);

  // Prevent browser zoom gestures and shortcuts
  useEffect(() => {
    const preventZoom = (e: Event) => {
      // Prevent Ctrl+wheel zoom
      if (e.type === "wheel" && (e as WheelEvent).ctrlKey) {
        e.preventDefault();
        return false;
      }

      // Prevent zoom keyboard shortcuts
      if (e.type === "keydown") {
        const keyEvent = e as KeyboardEvent;
        if (
          (keyEvent.ctrlKey || keyEvent.metaKey) &&
          (keyEvent.key === "=" ||
            keyEvent.key === "+" ||
            keyEvent.key === "-" ||
            keyEvent.key === "0" ||
            keyEvent.key.toLowerCase() === "num+0")
        ) {
          e.preventDefault();
          return false;
        }
      }

      // Prevent touch zoom gestures
      if (
        e.type === "gesturestart" ||
        e.type === "gesturechange" ||
        e.type === "gestureend"
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Add event listeners to prevent browser zoom
    document.addEventListener("wheel", preventZoom, { passive: false });
    document.addEventListener("keydown", preventZoom, { passive: false });
    document.addEventListener("gesturestart", preventZoom, { passive: false });
    document.addEventListener("gesturechange", preventZoom, { passive: false });
    document.addEventListener("gestureend", preventZoom, { passive: false });

    // Prevent zoom on touch devices
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    document.addEventListener("touchstart", handleTouchStart, {
      passive: false,
    });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventZoom);
      document.removeEventListener("keydown", preventZoom);
      document.removeEventListener("gesturestart", preventZoom);
      document.removeEventListener("gesturechange", preventZoom);
      document.removeEventListener("gestureend", preventZoom);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, []);

  // Prevent leaving page with unsaved area drawings
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDrawingArea && drawingAreaVertices.length > 0) {
        e.preventDefault();
        e.returnValue =
          "You have an unfinished area drawing. Are you sure you want to leave?";
        return e.returnValue;
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDrawingArea, drawingAreaVertices.length]);

  const handleToolChange = useCallback(
    (newTool: string) => {
      // If currently drawing an area and switching away, show confirmation
      if (
        isDrawingArea &&
        newTool !== "draw-area" &&
        drawingAreaVertices.length > 0
      ) {
        setPendingToolChange(newTool);
        setShowUnsavedAreaDialog(true);
        return;
      }

      // Handle special tool changes
      if (newTool === "draw-area") {
        // Start area drawing mode
        graphStore.setDrawingAreaStart();
      } else if (newTool !== "draw-area" && isDrawingArea) {
        // End area drawing mode if switching away from draw-area tool
        graphStore.setDrawingAreaEnd();
        graphStore.clearDrawingVertices();
      }

      setTool(
        newTool as
          | "select"
          | "move"
          | "add-node"
          | "connect"
          | "pan"
          | "zoom"
          | "draw-area"
      );
    },
    [graphStore, isDrawingArea, drawingAreaVertices.length]
  );

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

  const handleToggleGrid = useCallback(() => {
    if (graph) {
      const updatedGraph = {
        ...graph,
        settings: {
          ...graph.settings,
          showGrid: !graph.settings.showGrid,
        },
      };
      graphStore.setGraph(updatedGraph);
    }
  }, [graph, graphStore]);

  const handleTogglePanoramaViewer = useCallback(() => {
    if (showPanoramaViewer) {
      // Closing panorama viewer
      togglePanoramaViewer();
      setPanoramaNode(null);
    } else {
      // Opening panorama viewer
      if (selectedNodeId) {
        const node = graph?.nodes.find((n) => n.id === selectedNodeId);
        if (node && (node.panorama_url || node.panorama_asset_id)) {
          // Set panorama node to current selected node if it has panorama
          setPanoramaNode(selectedNodeId);
        } else {
          // Just toggle the viewer even if no panorama
          togglePanoramaViewer();
        }
      } else {
        // Just toggle the viewer
        togglePanoramaViewer();
      }
    }
  }, [
    showPanoramaViewer,
    togglePanoramaViewer,
    selectedNodeId,
    graph?.nodes,
    setPanoramaNode,
  ]);

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (tool === "add-node") {
        addNode({ x, y, z: 0 });
      }
    },
    [tool, addNode]
  );

  const handleNodeSelect = useCallback(
    (nodeId: string) => {
      setSelectedNode(nodeId);
    },
    [setSelectedNode]
  );

  const handlePitchChange = useCallback(
    (pitch: number) => {
      if (panoramaNodeId) {
        updateNode(panoramaNodeId, { pitch });
      }
    },
    [panoramaNodeId, updateNode]
  );

  const handleConnectionStart = useCallback((nodeId: string) => {
    graphStore.setConnectingStart(nodeId);
  }, []);

  const handleConnectionComplete = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      addConnection(fromNodeId, toNodeId);
      graphStore.setConnectingEnd();
    },
    [addConnection]
  );

  const handleConnectionCancel = useCallback(() => {
    graphStore.setConnectingEnd();
  }, []);

  const handleDeleteConnection = useCallback((connectionId: string) => {
    // TODO: Implement deleteConnection in Zustand store
    console.log("Delete connection not yet implemented");
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: any, isDragging = false) => {
      // Check if this is a position update (dragging)
      const isPositionUpdate = updates.position !== undefined;

      if (isPositionUpdate && !isDraggingNode) {
        setIsDraggingNode(true);
      }

      // Filter out undefined/null values and check if we have at least one valid field to update
      const validUpdates = Object.fromEntries(
        Object.entries(updates).filter(
          ([key, value]) => value !== undefined && value !== null
        )
      );

      if (Object.keys(validUpdates).length === 0) {
        return;
      }

      // For position updates during dragging, only update local state for visual feedback
      if (isPositionUpdate && isDragging) {
        // Update Zustand store directly for immediate visual feedback
        graphStore.updateNode(nodeId, validUpdates);
        return;
      }

      // For final updates or non-position updates, sync with backend
      updateNode(nodeId, validUpdates);

      // Reset dragging state after a short delay to allow for smooth updates
      if (isPositionUpdate) {
        setTimeout(() => setIsDraggingNode(false), 100);
      }
    },
    [updateNode, isDraggingNode, graphStore]
  );

  const handleFloorplanSelect = useCallback(
    async (media: any) => {
      // Update the graph store immediately for instant feedback
      if (graph) {
        const updatedGraph = {
          ...graph,
          floorplan: {
            id: `floorplan-${graph.floorId}`,
            venueId: graph.venueId,
            floorId: graph.floorId,
            name: `Floorplan for ${graph.floorId}`,
            fileUrl: media.url,
            scale: 1,
            bounds: {
              width: media.width || 1000,
              height: media.height || 1000,
              minX: -(media.width || 1000) / 2,
              minY: -(media.height || 1000) / 2,
              maxX: (media.width || 1000) / 2,
              maxY: (media.height || 1000) / 2,
            },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        };
        graphStore.setGraph(updatedGraph);
      }

      // Then persist to backend
      if (graphProvider.updateFloorplan) {
        try {
          await graphProvider.updateFloorplan({
            map_image_id: media.asset_id,
            map_width: media.width || 1000,
            map_height: media.height || 1000,
          });
        } catch (error) {
          console.error("Failed to persist floorplan update:", error);
          // Optionally revert the optimistic update here
        }
      }
    },
    [graphProvider, graph, graphStore]
  );

  const handleFloorplanUpdate = useCallback(
    async (media: any) => {
      // Update the graph store immediately for instant feedback
      if (graph?.floorplan) {
        const updatedFloorplan = {
          ...graph.floorplan,
          fileUrl: media.url,
          bounds: {
            width: media.width || 1000,
            height: media.height || 1000,
            minX: -(media.width || 1000) / 2,
            minY: -(media.height || 1000) / 2,
            maxX: (media.width || 1000) / 2,
            maxY: (media.height || 1000) / 2,
          },
          updatedAt: new Date(),
        };

        const updatedGraph = {
          ...graph,
          floorplan: updatedFloorplan,
        };
        graphStore.setGraph(updatedGraph);
      }

      // Then persist to backend
      if (graphProvider.updateFloorplan) {
        try {
          await graphProvider.updateFloorplan({
            map_image_id: media.asset_id,
            map_width: media.width || 1000,
            map_height: media.height || 1000,
          });
        } catch (error) {
          console.error("Failed to persist floorplan update:", error);
          // Optionally revert the optimistic update here
        }
      }
    },
    [graphProvider, graph, graphStore]
  );

  const handleNavigateToNode = useCallback(
    (nodeId: string) => {
      // Navigate to the selected node
      setSelectedNode(nodeId);
      // Also set as panorama node to keep it open
      setPanoramaNode(nodeId);

      // Initialize panorama rotation with node's current heading
      const node = graph?.nodes.find((n) => n.id === nodeId);
      if (node) {
        graphStore.setPanoramaBackgroundOffset(node.rotation || 0);
        graphStore.setPanoramaRotation(0, node.pitch || 0, "nav");
      }
    },
    [setSelectedNode, setPanoramaNode, graph?.nodes, graphStore]
  );

  // Panorama rotation is live-synced directly from the PanoramaViewer
  // so we don't need to set up intermediate callbacks in this parent.

  const handleAreaSelect = useCallback(
    (areaId: string) => {
      graphStore.setSelectedArea(areaId);
    },
    [graphStore]
  );

  const handleAreaVertexUpdate = useCallback(
    (
      areaId: string,
      vertexIndex: number,
      position: { x: number; y: number },
      isDragging = false
    ) => {
      const area = graph?.areas.find((a) => a.id === areaId);
      if (area) {
        if (isDragging) {
          // Update local state only during dragging
          const newBoundary = [...area.boundary];
          newBoundary[vertexIndex] = position;
          graphStore.updateArea(areaId, { boundary: newBoundary });
        } else {
          // Sync to backend when dragging is complete
          const newBoundary = [...area.boundary];
          newBoundary[vertexIndex] = position;
          graphProvider.updateArea(areaId, { boundary: newBoundary });
        }
      }
    },
    [graph?.areas, graphProvider, graphStore]
  );

  const handleAreaMove = useCallback(
    (areaId: string, delta: { x: number; y: number }, isDragging = false) => {
      const area = graph?.areas.find((a) => a.id === areaId);
      if (area) {
        const newBoundary = area.boundary.map((vertex) => ({
          x: vertex.x + delta.x,
          y: vertex.y + delta.y,
        }));

        if (isDragging) {
          // Update local state only during dragging
          graphStore.updateArea(areaId, { boundary: newBoundary });
        } else {
          // Sync to backend when dragging is complete
          graphProvider.updateArea(areaId, { boundary: newBoundary });
        }
      }
    },
    [graph?.areas, graphProvider, graphStore]
  );

  const handleDrawingVertexAdd = useCallback(
    (position: { x: number; y: number }) => {
      graphStore.addDrawingVertex(position);
    },
    [graphStore]
  );

  const handleCreateArea = useCallback(
    async (areaData: {
      name: string;
      category: string;
      description?: string;
    }) => {
      if (drawingAreaVertices.length < 3) {
        alert("An area must have at least 3 vertices");
        return;
      }

      try {
        await graphProvider.createArea({
          name: areaData.name,
          category: areaData.category,
          description: areaData.description || "",
          boundary: drawingAreaVertices,
        });

        // Clear drawing state
        graphStore.setDrawingAreaEnd();
        graphStore.clearDrawingVertices();
      } catch (error) {
        console.error("Failed to create area:", error);
        alert("Failed to create area. Please try again.");
      }
    },
    [drawingAreaVertices, graphProvider, graphStore]
  );

  const handleConfirmToolChange = useCallback(() => {
    if (pendingToolChange) {
      // End area drawing mode and clear vertices
      graphStore.setDrawingAreaEnd();
      graphStore.clearDrawingVertices();

      // Apply the tool change
      setTool(
        pendingToolChange as
          | "select"
          | "move"
          | "add-node"
          | "connect"
          | "pan"
          | "zoom"
          | "draw-area"
      );
    }
    setShowUnsavedAreaDialog(false);
    setPendingToolChange(null);
  }, [pendingToolChange, graphStore]);

  const handleCancelToolChange = useCallback(() => {
    setShowUnsavedAreaDialog(false);
    setPendingToolChange(null);
  }, []);

  const panoramaNode = useMemo(() => {
    const node = graph?.nodes.find((n) => n.id === panoramaNodeId);
    return node
      ? {
          ...node,
          // Only include properties that should trigger panorama updates
          id: node.id,
          rotation: node.rotation,
          pitch: node.pitch,
          panorama_url: node.panorama_url,
        }
      : null;
  }, [
    panoramaNodeId,
    graph?.nodes.find((n) => n.id === panoramaNodeId)?.rotation,
    graph?.nodes.find((n) => n.id === panoramaNodeId)?.pitch,
    graph?.nodes.find((n) => n.id === panoramaNodeId)?.panorama_url,
  ]);

  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="h-full">
        {/* Canvas Panel */}
        <ResizablePanel
          defaultSize={showPanoramaViewer ? 60 : 100}
          minSize={30}
        >
          <div className="flex flex-col h-full">
            <CanvasToolbar
              currentTool={tool}
              onToolChange={handleToolChange}
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onResetView={handleResetView}
              onFloorplanSelect={handleFloorplanSelect}
              onFloorplanUpdate={handleFloorplanUpdate}
              canUndo={false} // TODO: Implement undo/redo in Zustand store
              canRedo={false} // TODO: Implement undo/redo in Zustand store
              onUndo={() => {}} // TODO: Implement undo/redo in Zustand store
              onRedo={() => {}} // TODO: Implement undo/redo in Zustand store
              onTogglePanoramaViewer={handleTogglePanoramaViewer}
              onToggleGrid={handleToggleGrid}
              onShowPropertiesPanelChange={onShowPropertiesPanelChange}
              showPropertiesPanel={showPropertiesPanel}
              onShowAreaPanelChange={onShowAreaPanelChange}
              showAreaPanel={showAreaPanel}
            />

            {/* Canvas */}
            <div
              className="flex-1 bg-muted/10 overflow-hidden relative canvas-container"
              style={{
                touchAction: "none", // Prevent touch zoom on mobile
                userSelect: "none", // Prevent text selection
              }}
            >
              <MapCanvas2D
                onNodeSelect={handleNodeSelect}
                onCanvasClick={handleCanvasClick}
                onNodeUpdate={handleNodeUpdate}
                onToolChange={handleToolChange}
                zoom={canvasZoom}
                panOffset={canvasPanOffset}
                onZoomChange={setCanvasZoom}
                onPanChange={setCanvasPanOffset}
                addNode={addNode}
                removeNode={deleteNode}
                onConnectionStart={handleConnectionStart}
                onConnectionComplete={handleConnectionComplete}
                onConnectionCancel={handleConnectionCancel}
                onDeleteConnection={handleDeleteConnection}
                pathPreview={pathPreview}
                onAreaSelect={handleAreaSelect}
                onAreaVertexUpdate={handleAreaVertexUpdate}
                onAreaMove={handleAreaMove}
                onDrawingVertexAdd={handleDrawingVertexAdd}
              />
            </div>

            {/* Status Bar */}
            <div className="px-4 py-2 bg-background border-t text-xs text-muted-foreground">
              {graph?.nodes.length || 0} Nodes •{" "}
              {graph?.connections.length || 0} Connections •{" "}
              {graph?.areas.length || 0} Areas • Tool: {tool}
            </div>
          </div>
        </ResizablePanel>

        {isDrawingArea && (
          <>
            <ResizableHandle withHandle />

            {/* Area Creation Panel */}
            <ResizablePanel defaultSize={25} minSize={20}>
              <AreaCreationPanel
                drawingAreaVertices={drawingAreaVertices}
                onCancel={() => {
                  graphStore.setDrawingAreaEnd();
                  graphStore.clearDrawingVertices();
                }}
                onCreateArea={handleCreateArea}
              />
            </ResizablePanel>
          </>
        )}

        {showPanoramaViewer && (
          <>
            <ResizableHandle withHandle />

            {/* Panorama Viewer Panel */}
            <ResizablePanel defaultSize={40} minSize={30}>
              <div className="h-full bg-background border-l p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold">Panorama Viewer</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      togglePanoramaViewer();
                      // Also clear the panorama node when closing
                      if (showPanoramaViewer) {
                        setPanoramaNode(null);
                      }
                    }}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
                <PanoramaViewer
                  selectedNode={panoramaNode}
                  graph={graph}
                  onNavigateToNode={handleNavigateToNode}
                />
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>

      {/* Unsaved Area Confirmation Dialog */}
      <AlertDialog
        open={showUnsavedAreaDialog}
        onOpenChange={setShowUnsavedAreaDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsaved Area Drawing</AlertDialogTitle>
            <AlertDialogDescription>
              You have an unfinished area drawing with{" "}
              {drawingAreaVertices.length} vertices. Switching tools will
              discard your current drawing. Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelToolChange}>
              Keep Drawing
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmToolChange}>
              Discard & Switch Tool
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
