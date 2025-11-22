"use client";

import { useState, useEffect } from "react";
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
import {
  ArrowLeft,
  Eye,
  Save,
  Share2,
  Upload,
  GitBranch,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { mockVenues } from "@/lib/api";
import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { GraphRevisionDetail } from "@/types/graph";
import { use } from "react";
import { toast } from "sonner";

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

  const [revision, setRevision] = useState<GraphRevisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorId, setFloorId] = useState("floor1");
  const [isPreviewMode, setIsPreviewMode] = useState(false);

  // Load revision data
  useEffect(() => {
    const loadRevision = async () => {
      try {
        setLoading(true);
        setError(null);
        const revisionData = await GraphRevisionService.getRevisionDetail(
          revisionId
        );
        setRevision(revisionData);
      } catch (err) {
        console.error("Failed to load revision:", err);
        setError("Failed to load revision");
        // Fallback to mock data
        setRevision({
          id: revisionId,
          venue_id: id,
          status: revisionId === "rev-1" ? "published" : "draft",
          note:
            revisionId === "rev-1" ? "Current live version" : "Draft revision",
          created_at: new Date().toISOString(),
          created_by: "Current User",
          floors: [],
        });
      } finally {
        setLoading(false);
      }
    };

    loadRevision();
  }, [id, revisionId]);

  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  const getStatusBadge = () => {
    if (!revision) return null;

    if (revision.status === "published") {
      return <Badge className="bg-green-600">Live</Badge>;
    }
    if (revision.status === "draft") {
      return <Badge variant="secondary">Draft</Badge>;
    }
    return <Badge variant="outline">Archived</Badge>;
  };

  const handleSave = async () => {
    if (!revision) return;

    try {
      // The graph context will handle saving to the backend
      // We can also save revision metadata if needed
      toast.success("Revision saved successfully");
    } catch (err) {
      console.error("Failed to save revision:", err);
      toast.error("Failed to save revision");
    }
  };

  const handlePublish = async () => {
    if (!revision) return;

    try {
      await GraphRevisionService.publishRevision(revision.id);
      toast.success("Revision published successfully");
      // Reload revision data
      const updatedRevision = await GraphRevisionService.getRevisionDetail(
        revisionId
      );
      setRevision(updatedRevision);
    } catch (err) {
      console.error("Failed to publish revision:", err);
      toast.error("Failed to publish revision");
    }
  };

  // Mock initial graph data - in real implementation, this would come from the revision
  const initialGraph = {
    id: `graph-${revisionId}`,
    venueId: id,
    floorId,
    name: `${venue.name} - ${revision?.note || "Revision"} - Floor ${floorId}`,
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
      floorplanOpacity: 0.5,
    },
    version: 1,
    isPublished: revision?.status === "published",
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading revision...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 items-center justify-center">
        <p className="text-destructive">{error}</p>
        <Link href={`/dashboard/venues/${id}/revision`}>
          <Button variant="outline">Back to Revisions</Button>
        </Link>
      </div>
    );
  }

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
                {venue.name} - {revision?.note || "Revision"}
              </h1>
              <p className="text-sm text-muted-foreground">
                Editing revision v{revision?.id.slice(-2) || "1"}
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
          {revision?.status === "draft" && (
            <Button variant="default" onClick={handlePublish}>
              Publish Revision
            </Button>
          )}
          <Button onClick={handleSave}>
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
          revisionId={revisionId}
        />
      </div>
    </div>
  );
}
