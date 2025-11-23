"use client";

import { useState } from "react";
import { GraphProvider } from "@/providers/GraphProvider";
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
import { useGraphStore } from "@/stores/graph-store";

function GraphEditorContent() {
  const graphStore = useGraphStore();
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [pathPreview, setPathPreview] = useState<string[] | null>(null);
  const [pathStartNode, setPathStartNode] = useState<string | null>(null);

  const { graph, selectedNodeId, isLoading, error } = graphStore;

  const handleValidate = () => {
    // TODO: Implement validation with Zustand store
    console.log("Validation not yet implemented");
  };

  const handleAutoLayout = () => {
    // TODO: Implement auto layout with Zustand store
    console.log("Auto layout not yet implemented");
  };

  const handlePathfinding = () => {
    if (!selectedNodeId || !pathStartNode) {
      setPathStartNode(selectedNodeId);
      return;
    }

    // TODO: Implement pathfinding with Zustand store
    console.log("Pathfinding not yet implemented");
    setPathStartNode(null);
  };

  const handleShowStats = () => {
    // TODO: Implement stats with Zustand store
    console.log("Stats not yet implemented");
  };

  const handleSave = async () => {
    // TODO: Implement save with Zustand store
    console.log("Save not yet implemented");
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
              disabled={!selectedNodeId}
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
  revisionId?: string;
}

export function GraphEditor({
  venueId,
  floorId,
  initialGraph,
  revisionId,
}: GraphEditorProps) {
  return (
    <GraphProvider venueId={venueId} revisionId={revisionId} floorId={floorId}>
      <GraphEditorContent />
    </GraphProvider>
  );
}
