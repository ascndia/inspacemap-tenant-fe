"use client";

import { useRef, useState, useCallback, useEffect, useMemo } from "react";
import { useGraph } from "@/contexts/graph-context";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { CanvasToolbar } from "./canvas-toolbar";
import { MapCanvas2D } from "./map-canvas-2d";
import PanoramaViewer from "./panorama-viewer";
import { Button } from "@/components/ui/button";

export function GraphCanvas({ pathPreview }: { pathPreview: string[] | null }) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    state,
    updateSettings,
    addNode,
    setSelectedNode,
    updateNode,
    deleteNode,
    addConnection,
    deleteConnection,
    undo,
    redo,
    canUndo,
    canRedo,
    loadFloorplan,
    updateFloorplan,
    setTool,
    setConnectingStart,
    setConnectingEnd,
    togglePanoramaViewer,
  } = useGraph();

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPanOffset, setCanvasPanOffset] = useState({ x: 0, y: 0 });
  const [isDraggingNode, setIsDraggingNode] = useState(false);

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

  const handleToolChange = (tool: string) => {
    setTool(tool as "select" | "add-node" | "connect" | "pan" | "zoom");
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
      if (state.ui.panoramaNodeId) {
        updateNode(state.ui.panoramaNodeId, { pitch });
      }
    },
    [state.ui.panoramaNodeId, updateNode]
  );

  const handleRotationChange = useCallback(
    (rotation: number) => {
      if (state.ui.panoramaNodeId) {
        updateNode(state.ui.panoramaNodeId, { rotation });
      }
    },
    [state.ui.panoramaNodeId, updateNode]
  );

  const handleConnectionStart = useCallback(
    (nodeId: string) => {
      setConnectingStart(nodeId);
    },
    [setConnectingStart]
  );

  const handleConnectionComplete = useCallback(
    (fromNodeId: string, toNodeId: string) => {
      addConnection(fromNodeId, toNodeId);
      setConnectingEnd();
    },
    [addConnection, setConnectingEnd]
  );

  const handleDeleteConnection = useCallback(
    (connectionId: string) => {
      deleteConnection(connectionId);
    },
    [deleteConnection]
  );

  const handleNodeUpdate = useCallback(
    (nodeId: string, updates: any) => {
      // Check if this is a position update (dragging)
      const isPositionUpdate = updates.position !== undefined;

      if (isPositionUpdate && !isDraggingNode) {
        setIsDraggingNode(true);
      }

      updateNode(nodeId, updates);

      // Reset dragging state after a short delay to allow for smooth updates
      if (isPositionUpdate) {
        setTimeout(() => setIsDraggingNode(false), 100);
      }
    },
    [updateNode, isDraggingNode]
  );

  const handleFloorplanSelect = useCallback(
    (media: any) => {
      if (state.graph) {
        const floorplan = {
          id: `floorplan_${Date.now()}`,
          venueId: state.graph.venueId,
          floorId: state.graph.floorId,
          name: media.name || "Floorplan",
          fileUrl: media.url,
          scale: 1, // Use consistent scale
          bounds: {
            width: 1000, // Default size, will be adjusted when image loads
            height: 1000,
            minX: -500,
            minY: -500,
            maxX: 500,
            maxY: 500,
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        loadFloorplan(floorplan);
      }
    },
    [state.graph, loadFloorplan]
  );

  const handleFloorplanUpdate = useCallback(
    async (media: any) => {
      if (state.graph && updateFloorplan) {
        try {
          // Update floorplan URL in the backend
          await updateFloorplan({
            map_image_id: media.id, // Assuming media.id is the asset ID
          });

          // Update floorplan in local state with new image URL
          const updatedFloorplan = {
            ...state.graph.floorplan,
            fileUrl: media.url,
            name: media.name || state.graph.floorplan?.name || "Floorplan",
            updatedAt: new Date(),
            // Reset bounds to trigger recalculation
            bounds: {
              width: 1000,
              height: 1000,
              minX: -500,
              minY: -500,
              maxX: 500,
              maxY: 500,
            },
          };

          // Force reload the floorplan to trigger image bounds recalculation
          loadFloorplan(updatedFloorplan);

          // Add a small delay to ensure the image loads and bounds are recalculated
          setTimeout(() => {
            if (state.graph?.floorplan) {
              // Trigger bounds recalculation by updating with current data
              loadFloorplan({
                ...updatedFloorplan,
                updatedAt: new Date(),
              });
            }
          }, 100);
        } catch (error) {
          console.error("Failed to update floorplan:", error);
        }
      }
    },
    [state.graph, updateFloorplan, loadFloorplan]
  );

  const selectedNode = state.graph?.nodes.find(
    (n) => n.id === state.ui.selectedNodeId
  );

  const panoramaNode = useMemo(() => {
    const node = state.graph?.nodes.find(
      (n) => n.id === state.ui.panoramaNodeId
    );
    return node
      ? {
          ...node,
          // Only include properties that should trigger panorama updates
          id: node.id,
          rotation: node.rotation,
          pitch: node.pitch,
          panoramaUrl: node.panoramaUrl,
        }
      : null;
  }, [
    state.ui.panoramaNodeId,
    state.graph?.nodes.find((n) => n.id === state.ui.panoramaNodeId)?.rotation,
    state.graph?.nodes.find((n) => n.id === state.ui.panoramaNodeId)?.pitch,
    state.graph?.nodes.find((n) => n.id === state.ui.panoramaNodeId)
      ?.panoramaUrl,
  ]);

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Canvas Panel */}
      <ResizablePanel
        defaultSize={state.ui.showPanoramaViewer ? 75 : 100}
        minSize={50}
      >
        <div className="flex flex-col h-full">
          <CanvasToolbar
            currentTool={state.ui.tool}
            onToolChange={handleToolChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onFloorplanSelect={handleFloorplanSelect}
            onFloorplanUpdate={handleFloorplanUpdate}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
            onTogglePanoramaViewer={togglePanoramaViewer}
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
              onDeleteConnection={handleDeleteConnection}
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

      {state.ui.showPanoramaViewer && (
        <>
          <ResizableHandle withHandle />

          {/* Panorama Viewer Panel */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <div className="h-full bg-background border-l p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Panorama Viewer</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePanoramaViewer}
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
              <PanoramaViewer
                selectedNode={panoramaNode}
                onRotationChange={handleRotationChange}
                onPitchChange={handlePitchChange}
                isDraggingNode={isDraggingNode}
              />
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  );
}
