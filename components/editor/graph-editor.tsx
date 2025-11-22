"use client";

import { useState } from "react";
import { GraphProvider } from "@/contexts/graph-context";
import { GraphCanvas } from "./graph-canvas";
import { PropertiesPanel } from "./properties-panel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import {
  Upload,
  Save,
  Play,
  Route,
  Zap,
  BarChart3,
  Settings,
  Eye,
} from "lucide-react";
import { useGraph } from "@/contexts/graph-context";

function GraphEditorContent() {
  const { state, validateGraph, autoLayout, findPath, getGraphStats } =
    useGraph();
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [pathPreview, setPathPreview] = useState<string[] | null>(null);
  const [pathStartNode, setPathStartNode] = useState<string | null>(null);

  const handleValidate = () => {
    const result = validateGraph();
    console.log("Validation result:", result);
    // TODO: Show validation results in UI
  };

  const handleAutoLayout = () => {
    autoLayout();
  };

  const handlePathfinding = () => {
    if (!state.ui.selectedNodeId || !pathStartNode) {
      setPathStartNode(state.ui.selectedNodeId);
      return;
    }

    const path = findPath(pathStartNode, state.ui.selectedNodeId);
    if (path) {
      setPathPreview(path.map((node) => node.id));
    }
    setPathStartNode(null);
  };

  const handleShowStats = () => {
    const stats = getGraphStats();
    console.log("Graph statistics:", stats);
    // TODO: Show stats in a dialog
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving graph:", state.graph);
  };

  const handleLoadFloorplan = () => {
    // TODO: Implement floorplan upload
    console.log("Loading floorplan...");
  };

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background/95 backdrop-blur">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Graph Editor</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleLoadFloorplan}>
              <Upload className="h-4 w-4 mr-2" />
              Load Floorplan
            </Button>
            <Button variant="outline" size="sm" onClick={handleAutoLayout}>
              <Zap className="h-4 w-4 mr-2" />
              Auto Layout
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePathfinding}
              disabled={!state.ui.selectedNodeId}
            >
              <Route className="h-4 w-4 mr-2" />
              {pathStartNode ? "Find Path" : "Start Path"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleShowStats}>
              <BarChart3 className="h-4 w-4 mr-2" />
              Stats
            </Button>
            <Button variant="outline" size="sm" onClick={handleValidate}>
              <Play className="h-4 w-4 mr-2" />
              Validate
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPropertiesPanel(!showPropertiesPanel)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Properties Panel
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Canvas Panel */}
          <ResizablePanel
            defaultSize={showPropertiesPanel ? 75 : 100}
            minSize={50}
          >
            <div className="h-full relative">
              <GraphCanvas pathPreview={pathPreview} />
            </div>
          </ResizablePanel>

          {showPropertiesPanel && (
            <>
              <ResizableHandle withHandle />

              {/* Properties Panel */}
              <ResizablePanel defaultSize={25} minSize={20}>
                <PropertiesPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );
}

interface GraphEditorProps {
  venueId: string;
  floorId: string;
  initialGraph?: any;
}

export function GraphEditor({
  venueId,
  floorId,
  initialGraph,
}: GraphEditorProps) {
  return (
    <GraphProvider initialGraph={initialGraph}>
      <GraphEditorContent />
    </GraphProvider>
  );
}
