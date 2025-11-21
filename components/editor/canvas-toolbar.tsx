"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { useGraph } from "@/contexts/graph-context";
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
} from "lucide-react";
import { MediaPicker } from "@/components/media/media-picker";

interface CanvasToolbarProps {
  currentTool: string;
  onToolChange: (tool: string) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onFloorplanSelect: (media: any) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function CanvasToolbar({
  currentTool,
  onToolChange,
  onZoomIn,
  onZoomOut,
  onResetView,
  onFloorplanSelect,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: CanvasToolbarProps) {
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

      <MediaPicker
        onSelect={onFloorplanSelect}
        trigger={
          <Button variant="ghost" size="sm" title="Load Floorplan">
            <ImageIcon className="h-4 w-4" />
          </Button>
        }
        acceptTypes={["image"]}
      />

      <div className="h-6 w-px bg-border mx-2" />

      <Button variant="ghost" size="sm" title="Zoom In" onClick={onZoomIn}>
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" title="Zoom Out" onClick={onZoomOut}>
        <ZoomOut className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        title="Reset View"
        onClick={onResetView}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>

      <div className="h-6 w-px bg-border mx-2" />

      <Button
        variant="ghost"
        size="sm"
        disabled={!canUndo}
        onClick={onUndo}
        title="Undo"
      >
        ↶
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={!canRedo}
        onClick={onRedo}
        title="Redo"
      >
        ↷
      </Button>
    </div>
  );
}
