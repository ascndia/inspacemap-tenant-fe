"use client";

import { Lock, Unlock } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  nodeId?: string;
  connectionId?: string;
  onSelectNode?: (nodeId: string) => void;
  onToggleLock?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  onAddNode?: (x: number, y: number) => void;
  onAddNodeWithPanorama?: (x: number, y: number) => void;
  onResetView?: () => void;
  onDeleteConnection?: (connectionId: string) => void;
  onViewPanorama?: (nodeId: string) => void;
  onSetPanorama?: (nodeId: string) => void;
  isNodeLocked?: boolean;
  hasPanorama?: boolean;
}

export function CanvasContextMenu({
  x,
  y,
  nodeId,
  connectionId,
  onSelectNode,
  onToggleLock,
  onDuplicateNode,
  onDeleteNode,
  onAddNode,
  onAddNodeWithPanorama,
  onResetView,
  onDeleteConnection,
  onViewPanorama,
  onSetPanorama,
  isNodeLocked,
  hasPanorama,
}: ContextMenuProps) {
  return (
    <div
      className="context-menu absolute bg-background border rounded-md shadow-lg py-1 z-50 min-w-48"
      style={{
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - 150),
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {connectionId ? (
        <>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm text-destructive"
            onClick={() => {
              onDeleteConnection?.(connectionId);
            }}
          >
            Delete Connection
          </button>
        </>
      ) : nodeId ? (
        <>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onSelectNode?.(nodeId);
            }}
          >
            Select Node
          </button>
          {hasPanorama && (
            <button
              className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
              onClick={() => {
                onViewPanorama?.(nodeId);
              }}
            >
              View Panorama
            </button>
          )}
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onSetPanorama?.(nodeId);
            }}
          >
            Set Panorama
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onToggleLock?.(nodeId);
            }}
          >
            {isNodeLocked ? (
              <>
                <Unlock className="mr-2 h-3 w-3" />
                Unlock Node
              </>
            ) : (
              <>
                <Lock className="mr-2 h-3 w-3" />
                Lock Node
              </>
            )}
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onDuplicateNode?.(nodeId);
            }}
          >
            Duplicate Node
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm text-destructive"
            onClick={() => {
              onDeleteNode?.(nodeId);
            }}
          >
            Delete Node
          </button>
        </>
      ) : (
        <>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onAddNode?.(x, y);
            }}
          >
            Add Node Here
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onAddNodeWithPanorama?.(x, y);
            }}
          >
            Add Node with Panorama
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-accent hover:text-accent-foreground text-sm"
            onClick={() => {
              onResetView?.();
            }}
          >
            Reset View
          </button>
        </>
      )}
    </div>
  );
}
