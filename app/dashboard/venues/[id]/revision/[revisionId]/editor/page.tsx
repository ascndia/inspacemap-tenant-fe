"use client";

import { useState, useEffect, use } from "react";
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
import { CreateFloorDialog } from "@/components/editor/create-floor-dialog";
import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { GraphRevisionDetail } from "@/types/graph";
import { useToast } from "@/hooks/use-toast";

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

  const { toast } = useToast();

  const [revision, setRevision] = useState<GraphRevisionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floorId, setFloorId] = useState<string>("");
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [showCreateFloorDialog, setShowCreateFloorDialog] = useState(false);

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

        // Set active floor to the first floor if available
        if (revisionData.floors && revisionData.floors.length > 0) {
          setFloorId(revisionData.floors[0].id);
        } else {
          setFloorId("");
        }
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
      toast({
        title: "Success",
        description: "Revision saved successfully",
      });
    } catch (err) {
      console.error("Failed to save revision:", err);
      toast({
        title: "Error",
        description: "Failed to save revision",
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    if (!revision) return;

    try {
      await GraphRevisionService.publishRevision(revisionId);
      toast({
        title: "Success",
        description: "Revision published successfully",
      });
      // Reload revision to update status
      const updatedRevision = await GraphRevisionService.getRevisionDetail(
        revisionId
      );
      setRevision(updatedRevision);
    } catch (err) {
      console.error("Failed to publish revision:", err);
      toast({
        title: "Error",
        description: "Failed to publish revision",
        variant: "destructive",
      });
    }
  };

  const handleFloorCreated = async () => {
    // Reload revision data to get updated floors
    try {
      const updatedRevision = await GraphRevisionService.getRevisionDetail(
        revisionId
      );
      setRevision(updatedRevision);

      // Set the newly created floor as active
      if (updatedRevision.floors && updatedRevision.floors.length > 0) {
        const newFloor =
          updatedRevision.floors[updatedRevision.floors.length - 1];
        setFloorId(newFloor.id);
      }
    } catch (error) {
      console.error("Failed to reload revision:", error);
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
            {revision?.floors && revision.floors.length > 0 ? (
              <Select value={floorId} onValueChange={setFloorId}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Select floor" />
                </SelectTrigger>
                <SelectContent>
                  {revision.floors.map((floor) => (
                    <SelectItem key={floor.id} value={floor.id}>
                      {floor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowCreateFloorDialog(true)}
              >
                Create First Floor
              </Button>
            )}
            {revision?.floors && revision.floors.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCreateFloorDialog(true)}
              >
                + Add Floor
              </Button>
            )}
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
        {revision?.floors && revision.floors.length > 0 && floorId ? (
          <GraphEditor
            venueId={id}
            floorId={floorId}
            initialGraph={initialGraph}
            revisionId={revisionId}
          />
        ) : (
          <div className="flex flex-col h-full items-center justify-center p-8 text-center">
            <div className="max-w-md space-y-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-muted-foreground"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold">No Floors Yet</h3>
                <p className="text-muted-foreground">
                  Start building your navigation graph by creating your first
                  floor.
                </p>
              </div>
              <Button onClick={() => setShowCreateFloorDialog(true)}>
                Create First Floor
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Create Floor Dialog */}
      <CreateFloorDialog
        open={showCreateFloorDialog}
        onOpenChange={setShowCreateFloorDialog}
        venueId={id}
        onFloorCreated={handleFloorCreated}
      />
    </div>
  );
}
