"use client";

import { useGraphStore } from "@/stores/graph-store";
import { Button } from "@/components/ui/button";
import {
  MousePointer2,
  PlusCircle,
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ImageIcon,
  Link,
  Eye,
  Edit,
  Grid3X3,
  Settings,
  Square,
} from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";

interface CanvasToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFloorplanSelect: (media: any) => void;
  onFloorplanUpdate?: (media: any) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onTogglePanoramaViewer?: () => void;
  onToggleGrid?: () => void;
  onShowPropertiesPanelChange?: (show: boolean) => void;
  showPropertiesPanel: boolean;
}

export function CanvasToolbar({
  currentTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFloorplanSelect,
  onFloorplanUpdate,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onTogglePanoramaViewer,
  onToggleGrid,
  onShowPropertiesPanelChange,
  showPropertiesPanel,
}: CanvasToolbarProps) {
  const { showPanoramaViewer, graph } = useGraphStore();
  return (
    <div className="flex items-center gap-2 p-2 bg-background border-b">
      <Button
        variant={currentTool === "select" ? "default" : "ghost"}
        size="sm"
        title="Select"
        onClick={() => onToolChange("select")}
      >
        <MousePointer2 className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTool === "move" ? "default" : "ghost"}
        size="sm"
        title="Move Nodes"
        onClick={() => onToolChange("move")}
      >
        <Move className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTool === "add-node" ? "default" : "ghost"}
        size="sm"
        title="Add Node"
        onClick={() => onToolChange("add-node")}
      >
        <PlusCircle className="h-4 w-4" />
      </Button>
      <Button
        variant={currentTool === "pan" ? "default" : "ghost"}
        size="sm"
        title="Pan"
        onClick={() => onToolChange("pan")}
      >
        <Move className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-2" />

      <Button
        variant={currentTool === "connect" ? "default" : "ghost"}
        size="sm"
        title="Connect Nodes"
        onClick={() => onToolChange("connect")}
      >
        <Link className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-2" />

      <Button
        variant={currentTool === "draw-area" ? "default" : "ghost"}
        size="sm"
        title="Draw Area"
        onClick={() => onToolChange("draw-area")}
      >
        <Square className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-2" />

      <Button
        variant={graph?.settings?.showGrid ? "default" : "ghost"}
        size="sm"
        title="Toggle Grid"
        onClick={onToggleGrid}
      >
        <Grid3X3 className="h-4 w-4" />
      </Button>

      <MediaPicker
        onSelect={onFloorplanSelect}
        trigger={
          <Button variant="ghost" size="sm" title="Load Floorplan">
            <ImageIcon className="h-4 w-4" />
          </Button>
        }
        acceptTypes={["image"]}
      />

      {graph?.floorplan && onFloorplanUpdate && (
        <MediaPicker
          onSelect={onFloorplanUpdate}
          trigger={
            <Button variant="ghost" size="sm" title="Change Floorplan Image">
              <Edit className="h-4 w-4" />
            </Button>
          }
          acceptTypes={["image"]}
        />
      )}

      <div className="mx-2 ml-auto" />

      <Button
        variant={showPanoramaViewer ? "default" : "ghost"}
        size="sm"
        title="Toggle Panorama Viewer"
        onClick={onTogglePanoramaViewer}
      >
        {showPanoramaViewer ? (
          <Eye className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
      <Button
        variant={showPropertiesPanel ? "default" : "ghost"}
        size="sm"
        onClick={() => onShowPropertiesPanelChange?.(!showPropertiesPanel)}
        title="Toggle Properties Panel"
      >
        <Settings className="h-4 w-4" />
      </Button>
    </div>
  );
}
