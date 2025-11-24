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

import { useGraphStore } from "@/stores/graph-store";

function GraphEditorContent() {
  const graphStore = useGraphStore();
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [pathPreview, setPathPreview] = useState<string[] | null>(null);
  const [pathStartNode, setPathStartNode] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Canvas Panel */}
          <ResizablePanel
            defaultSize={showPropertiesPanel ? 75 : 100}
            minSize={50}
          >
            <div className="h-full relative">
              <GraphCanvas
                showPropertiesPanel={showPropertiesPanel}
                onShowPropertiesPanelChange={setShowPropertiesPanel}
                pathPreview={pathPreview}
              />
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
