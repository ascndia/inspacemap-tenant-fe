"use client";

import { useState } from "react";
import { GraphProvider } from "@/providers/GraphProvider";
import { GraphCanvas } from "./graph-canvas";
import { PropertiesPanel } from "./properties-panel";
import { AreaPanel } from "./area-panel";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";

import { useGraphStore } from "@/stores/graph-store";

function GraphEditorContent() {
  const graphStore = useGraphStore();
  const [showPropertiesPanel, setShowPropertiesPanel] = useState(true);
  const [showAreaPanel, setShowAreaPanel] = useState(false);
  const [pathPreview, setPathPreview] = useState<string[] | null>(null);
  const [pathStartNode, setPathStartNode] = useState<string | null>(null);

  return (
    <div className="h-full flex flex-col">
      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Canvas Panel */}
          <ResizablePanel
            defaultSize={showPropertiesPanel || showAreaPanel ? 60 : 100}
            minSize={50}
          >
            <GraphCanvas
              showPropertiesPanel={showPropertiesPanel}
              onShowPropertiesPanelChange={setShowPropertiesPanel}
              showAreaPanel={showAreaPanel}
              onShowAreaPanelChange={setShowAreaPanel}
              pathPreview={pathPreview}
            />
          </ResizablePanel>

          {showAreaPanel && (
            <>
              <ResizableHandle withHandle />

              {/* Area Panel */}
              <ResizablePanel defaultSize={20} minSize={15}>
                <AreaPanel />
              </ResizablePanel>
            </>
          )}

          {showPropertiesPanel && (
            <>
              <ResizableHandle withHandle />

              {/* Properties Panel */}
              <ResizablePanel defaultSize={20} minSize={15}>
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
