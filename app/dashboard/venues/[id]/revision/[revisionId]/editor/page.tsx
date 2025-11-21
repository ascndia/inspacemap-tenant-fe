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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Eye, Save, Share2, Upload, GitBranch } from "lucide-react";
import Link from "next/link";
import { mockVenues } from "@/lib/api";

import { use } from "react";

interface RevisionEditorPageProps {
  params: Promise<{
    id: string;
    revisionId: string;
  }>;
}

export default function RevisionEditorPage({
  params,
}: RevisionEditorPageProps) {
  const { id, revisionId } = use(params);

  // In a real app, fetch venue and revision data
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  const [floorId, setFloorId] = useState("floor1");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Mock revision data - in real app, this would come from API
  const revision = {
    id: revisionId,
    name:
      revisionId === "rev-1"
        ? "Live Revision"
        : revisionId === "rev-2"
        ? "Draft Revision"
        : revisionId === "new"
        ? "New Revision"
        : "Revision",
    version:
      revisionId === "rev-1"
        ? 3
        : revisionId === "rev-2"
        ? 4
        : revisionId === "new"
        ? 5
        : 1,
    status:
      revisionId === "rev-1"
        ? "live"
        : revisionId === "rev-2"
        ? "draft"
        : "draft",
    isLive: revisionId === "rev-1",
    isDraft: revisionId === "rev-2" || revisionId === "new",
  };

  // Mock initial graph data
  const initialGraph = {
    id: `graph-${revisionId}`,
    venueId: id,
    floorId,
    name: `${venue.name} - ${revision.name} - Floor ${floorId}`,
    nodes: [
      {
        id: "node-1",
        position: { x: 0, y: 0, z: 0 },
        rotation: 0,
        heading: 0,
        fov: 75,
        connections: ["node-2"],
        label: "Entrance",
        panoramaUrl: "/panoramas/lobby.jpg", // Mock URL
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
        panoramaUrl: "/panoramas/lobby.jpg", // Mock URL
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
    version: revision.version,
    isPublished: revision.isLive,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const getStatusBadge = () => {
    if (revision.isLive) {
      return <Badge className="bg-green-600">Live</Badge>;
    }
    if (revision.isDraft) {
      return <Badge variant="secondary">Draft</Badge>;
    }
    return <Badge variant="outline">Archived</Badge>;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/venues/${id}/revision`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <GitBranch className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-lg font-semibold md:text-2xl">
                {venue.name} - {revision.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                Editing revision v{revision.version}
              </p>
            </div>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2">
            <Select value={floorId} onValueChange={setFloorId}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                {venue.floors.map((floor, index) => (
                  <SelectItem key={floor.id} value={floor.id}>
                    Floor {index + 1}
                  </SelectItem>
                ))}
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
            Save Revision
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
        <GraphEditor
          venueId={id}
          floorId={floorId}
          initialGraph={initialGraph}
        />
      </div>
    </div>
  );
}
