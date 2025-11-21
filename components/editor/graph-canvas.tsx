"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { useGraph } from "@/contexts/graph-context";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { CanvasToolbar } from "./canvas-toolbar";
import { MapCanvas2D } from "./map-canvas-2d";
import PanoramaViewer from "./panorama-viewer";

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
    setTool,
    setConnectingStart,
    setConnectingEnd,
  } = useGraph();

  const [canvasZoom, setCanvasZoom] = useState(1);
  const [canvasPanOffset, setCanvasPanOffset] = useState({ x: 0, y: 0 });

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

  const handleFloorplanSelect = useCallback(
    (media: any) => {
      if (state.graph) {
        const floorplan = {
          id: `floorplan_${Date.now()}`,
          venueId: state.graph.venueId,
          floorId: state.graph.floorId,
          name: media.name || "Floorplan",
          fileUrl: media.url,
          scale: 1,
          bounds: {
            width: 1000,
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

  const selectedNode = state.graph?.nodes.find(
    (n) => n.id === state.ui.selectedNodeId
  );

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full">
      {/* Canvas Panel */}
      <ResizablePanel defaultSize={75} minSize={50}>
        <div className="flex flex-col h-full">
          <CanvasToolbar
            currentTool={state.ui.tool}
            onToolChange={handleToolChange}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onResetView={handleResetView}
            onFloorplanSelect={handleFloorplanSelect}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={undo}
            onRedo={redo}
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
              onNodeUpdate={updateNode}
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
