"use client";

import { useState } from "react";
import { GraphEditor } from "@/components/editor/graph-editor";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Eye, Save, Share2, Upload } from "lucide-react";

export default function GraphEditorPage() {
  const [venueId, setVenueId] = useState("venue1");
  const [floorId, setFloorId] = useState("floor1");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Mock initial graph data
  const initialGraph = {
    id: "graph-1",
    venueId,
    floorId,
    name: "Floor 1 Navigation Graph",
    nodes: [
      {
        id: "node-1",
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        heading: 0,
        fov: 75,
        connections: ["node-2"],
        label: "Entrance",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "node-2",
        position: { x: 3, y: 0, z: 2 },
        rotation: 90,
        heading: 90,
        fov: 75,
        connections: ["node-1", "node-3"],
        label: "Lobby",
        panoramaUrl: "/panoramas/lobby.jpg", // Mock URL
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "node-3",
        position: { x: 6, y: 0, z: 0 },
        rotation: 180,
        heading: 180,
        fov: 75,
        connections: ["node-2"],
        label: "Hallway",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    connections: [
      {
        id: "conn-1",
        fromNodeId: "node-1",
        toNodeId: "node-2",
        distance: 3.6,
        bidirectional: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "conn-2",
        fromNodeId: "node-2",
        toNodeId: "node-3",
        distance: 3.6,
        bidirectional: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    panoramas: [],
    settings: {
      gridSize: 20,
      snapToGrid: true,
      showGrid: true,
      showLabels: true,
      showConnections: true,
      connectionStyle: "straight" as const,
      nodeSize: 1,
      autoSave: true,
      collaboration: false,
    },
    version: 1,
    isPublished: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold md:text-2xl">Graph Editor</h1>
          <div className="flex items-center gap-2">
            <Select value={venueId} onValueChange={setVenueId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue1">Grand Plaza Mall</SelectItem>
                <SelectItem value="venue2">Tech Hub Office</SelectItem>
              </SelectContent>
            </Select>
            <Select value={floorId} onValueChange={setFloorId}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor1">Floor 1</SelectItem>
                <SelectItem value="floor2">Floor 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            Load Floorplan
          </Button>
          <Button
            variant={isPreviewMode ? "default" : "outline"}
            onClick={() => setIsPreviewMode(!isPreviewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewMode ? "Edit Mode" : "Preview 3D"}
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Graph
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
        <GraphEditor
          venueId={venueId}
          floorId={floorId}
          initialGraph={initialGraph}
        />
      </div>
    </div>
  );
}
