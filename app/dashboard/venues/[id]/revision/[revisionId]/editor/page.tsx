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
import { CreateFloorDialog } from "@/components/editor/create-floor-dialog";
import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { GraphRevisionDetail } from "@/types/graph";
import { useToast } from "@/hooks/use-toast";
import { venueService } from "@/lib/services/venue-service";
import { VenueDetail } from "@/types/venue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Edit } from "lucide-react";
import { PermissionGuard } from "@/components/auth/permission-guard";

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
  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [graphData, setGraphData] = useState<any>(null);
  const [floorId, setFloorId] = useState<string>("");
  const [showCreateFloorDialog, setShowCreateFloorDialog] = useState(false);
  const [showEditRevisionDialog, setShowEditRevisionDialog] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [publishNote, setPublishNote] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);

  // Load revision and venue data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load venue data
        const venueResponse = await venueService.getVenueById(id);
        if (venueResponse.success && venueResponse.data) {
          setVenue(venueResponse.data);
        } else {
          throw new Error("Failed to load venue data");
        }

        // Load revision data
        const revisionData = await GraphRevisionService.getRevisionDetail(
          revisionId
        );
        setRevision(revisionData);
        setRevisionNote(revisionData.note || "");

        // Load graph data for the venue
        const graphResponse = await GraphRevisionService.getGraphData(
          revisionId
        );
        console.log("Graph response:", graphResponse);
        setGraphData(graphResponse);

        // Set active floor to the first floor if available
        if (revisionData.floors && revisionData.floors.length > 0) {
          setFloorId(revisionData.floors[0].id);
        } else {
          setFloorId("");
        }
      } catch (err) {
        console.error("Failed to load data:", err);
        setError("Failed to load revision or venue data");
        // Fallback to mock data for development
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
        setVenue({
          id: id,
          organization_id: "org-1",
          name: `Venue ${id}`,
          slug: `venue-${id}`,
          description: "Venue description",
          address: "123 Main St",
          city: "City",
          province: "Province",
          postal_code: "12345",
          full_address: "123 Main St, City, Province 12345",
          coordinates: { latitude: 0, longitude: 0 },
          visibility: "public",
          gallery: null,
          pois: null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [id, revisionId]);

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

  // Enhanced publish function with validation and note
  const handlePublishWithValidation = async () => {
    if (!revision || !venue) return;

    // Validation: Check if there are floors with nodes
    const hasValidFloors = revision.floors && revision.floors.length > 0;
    const hasNodes =
      hasValidFloors &&
      revision.floors.some((floor) => {
        // For now, we can't check nodes from revision data, so we'll assume it's valid
        // In a real implementation, you'd check the graph data
        return true; // TODO: Implement proper node validation
      });

    if (!hasValidFloors) {
      toast({
        title: "Cannot Publish",
        description: "Revision must have at least one floor defined",
        variant: "destructive",
      });
      return;
    }

    if (!hasNodes) {
      toast({
        title: "Cannot Publish",
        description: "Revision must have navigation nodes defined",
        variant: "destructive",
      });
      return;
    }

    setShowPublishDialog(true);
  };

  const handleConfirmPublish = async () => {
    if (!revision || !venue) return;

    setIsPublishing(true);
    try {
      // Call publish API with note
      await GraphRevisionService.publishRevision(
        revisionId,
        publishNote || undefined
      );

      toast({
        title: "Success",
        description:
          "Revision published successfully! A new draft has been created for future edits.",
      });

      // Close dialog and redirect to revisions page
      setShowPublishDialog(false);
      setPublishNote("");

      // Redirect to revisions page after a short delay
      setTimeout(() => {
        window.location.href = `/dashboard/venues/${id}/revision`;
      }, 1500);
    } catch (err: any) {
      console.error("Failed to publish revision:", err);
      toast({
        title: "Publish Failed",
        description: err.message || "Failed to publish revision",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSaveRevisionNote = async () => {
    if (!revision) return;

    try {
      await GraphRevisionService.updateRevision(revisionId, {
        note: revisionNote,
      });
      toast({
        title: "Success",
        description: "Revision note updated successfully",
      });
      setShowEditRevisionDialog(false);
      // Reload revision to update the note
      const updatedRevision = await GraphRevisionService.getRevisionDetail(
        revisionId
      );
      setRevision(updatedRevision);
    } catch (err) {
      console.error("Failed to update revision note:", err);
      toast({
        title: "Error",
        description: "Failed to update revision note",
        variant: "destructive",
      });
    }
  };

  const handleFloorCreated = async () => {
    try {
      // Reload revision data to get the updated list of floors
      const updatedRevision = await GraphRevisionService.getRevisionDetail(
        revisionId
      );
      setRevision(updatedRevision);

      // Set the active floor to the newly created floor (last in the list)
      if (updatedRevision.floors && updatedRevision.floors.length > 0) {
        const newFloor =
          updatedRevision.floors[updatedRevision.floors.length - 1];
        setFloorId(newFloor.id);
      }

      toast({
        title: "Success",
        description: "Floor created successfully",
      });
    } catch (err) {
      console.error("Failed to reload revision after floor creation:", err);
      toast({
        title: "Warning",
        description: "Floor created but failed to refresh the view",
        variant: "destructive",
      });
    }
  };

  // Build graph data for the selected floor
  const getFloorGraphData = () => {
    if (!graphData || !floorId || !revision) return null;

    // Find the floor data from the revision
    const floorData = revision.floors?.find((f) => f.id === floorId);
    if (!floorData) return null;

    // Get nodes and connections for this floor from graphData
    // For now, return a basic structure - this will be enhanced when the API provides floor-specific data
    return {
      id: `graph-${revisionId}-${floorId}`,
      venueId: id,
      floorId,
      name: `${venue?.name || "Venue"} - ${revision.note || "Revision"} - ${
        floorData.name
      }`,
      nodes: [], // Will be populated from API
      connections: [], // Will be populated from API
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
      isPublished: revision.status === "published",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
        <p>Loading revision and venue data...</p>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <div className="flex flex-col h-[calc(100vh-6rem)] gap-4 items-center justify-center">
        <p className="text-destructive">
          {error || "Failed to load venue data"}
        </p>
        <Link href={`/dashboard/venues/${id}/revision`}>
          <Button variant="outline">Back to Revisions</Button>
        </Link>
      </div>
    );
  }

  return (
    <PermissionGuard
      permission="venue:update"
      fallback={
        <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Link href={`/dashboard/venues/${id}/revision`}>
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <div className="flex-1">
                <h1 className="text-lg font-semibold md:text-2xl">
                  Graph Editor
                </h1>
                <p className="text-sm text-muted-foreground">
                  Edit navigation graph revisions for this venue
                </p>
              </div>
            </div>
          </div>
          <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
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
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Access Denied</h3>
                  <p className="text-muted-foreground">
                    You don't have permission to edit graph revisions for this
                    venue.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      }
    >
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
              <div>
                <p className="text-sm text-muted-foreground">
                  Editing {venue.name} - revision v
                  {revision?.id.slice(-2) || "1"}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditRevisionDialog(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
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
            <Button disabled variant="outline">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            {revision?.status === "draft" && (
              <Button variant="default" onClick={handlePublishWithValidation}>
                Publish Revision
              </Button>
            )}
          </div>
        </div>

        {/* Editor Workspace */}
        <div className="flex-1 min-h-0 border rounded-lg overflow-hidden bg-background">
          {revision?.floors && revision.floors.length > 0 && floorId ? (
            <GraphEditor
              venueId={id}
              floorId={floorId}
              initialGraph={getFloorGraphData()}
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
          revisionId={revisionId}
          onFloorCreated={handleFloorCreated}
        />

        {/* Edit Revision Dialog */}
        <Dialog
          open={showEditRevisionDialog}
          onOpenChange={setShowEditRevisionDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Revision Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="revision-note">Revision Note</Label>
                <Textarea
                  id="revision-note"
                  value={revisionNote}
                  onChange={(e) => setRevisionNote(e.target.value)}
                  placeholder="Enter a note for this revision..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditRevisionDialog(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveRevisionNote}>Save Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Publish Revision Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Publish Graph Changes</DialogTitle>
              <p className="text-sm text-muted-foreground">
                This will make the current draft live for all users. A new draft
                will be created for future edits.
              </p>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="publish-note">Release Notes (Optional)</Label>
                <Textarea
                  id="publish-note"
                  value={publishNote}
                  onChange={(e) => setPublishNote(e.target.value)}
                  placeholder="Describe the changes in this version..."
                  rows={3}
                  maxLength={255}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {publishNote.length}/255 characters
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowPublishDialog(false)}
                disabled={isPublishing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmPublish}
                disabled={isPublishing}
                className="bg-green-600 hover:bg-green-700"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish Changes"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGuard>
  );
}
