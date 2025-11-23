"use client";

import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Calendar,
  User,
  GitBranch,
  Trash2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { GraphRevision } from "@/types/graph";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EditRevisionModal } from "@/components/revisions/edit-revision-modal";
import { DeleteRevisionConfirmModal } from "@/components/revisions/delete-revision-confirm-modal";
import { venueService } from "@/lib/services/venue-service";

interface VenueRevisionsPageProps {
  params: Promise<{ id: string }>;
}

export default function VenueRevisionsPage({
  params,
}: VenueRevisionsPageProps) {
  const [venueId, setVenueId] = useState<string>("");
  const [venueSlug, setVenueSlug] = useState<string>("");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedRevision, setSelectedRevision] = useState<any>(null);
  const [hasDraftRevision, setHasDraftRevision] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [revisionToDelete, setRevisionToDelete] = useState<any>(null);
  const [deletingRevision, setDeletingRevision] = useState(false);
  const router = useRouter();

  // Resolve params
  useEffect(() => {
    params.then(async ({ id }) => {
      setVenueId(id);

      // Fetch venue details to get the slug
      try {
        const venueResponse = await venueService.getVenueById(id);
        if (venueResponse.success && venueResponse.data) {
          setVenueSlug(venueResponse.data.slug);
        }
      } catch (err) {
        console.error("Failed to fetch venue details:", err);
        // Fallback to using ID as slug if fetch fails
        setVenueSlug(id);
      }

      loadRevisions(id);
    });
  }, [params]);

  const loadRevisions = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await GraphRevisionService.getRevisions(id);
      // Ensure data is an array (handle null responses from API)
      const revisionsData = Array.isArray(data) ? data : [];
      setRevisions(revisionsData);

      // Check if there's already a draft revision
      const hasDraft = revisionsData.some((rev: any) => rev.status === "draft");
      setHasDraftRevision(hasDraft);
    } catch (err) {
      console.error("Failed to load revisions:", err);
      setError("Failed to load revisions");
      setRevisions([]); // Set empty array instead of mock data
      setHasDraftRevision(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRevision = async () => {
    if (!venueId) return;

    try {
      setCreatingRevision(true);
      const revisionId = await GraphRevisionService.createDraftRevision(
        venueId,
        "New draft revision"
      );
      toast.success("Draft revision created successfully");
      router.push(`/dashboard/venues/${venueId}/revision/${revisionId}/editor`);
    } catch (err: any) {
      console.error("Failed to create revision:", err);

      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorData = err.response?.data;

        // Check if the error message is a string containing "draft already exists"
        if (
          typeof errorData === "string" &&
          errorData.toLowerCase().includes("draft") &&
          errorData.toLowerCase().includes("already")
        ) {
          toast.error(
            "A draft revision already exists for this venue. You can only have one draft at a time.",
            {
              description:
                "Please complete or delete the existing draft revision before creating a new one.",
              duration: 6000,
            }
          );
          return;
        }

        // Check for message property in error response
        const errorMessage = errorData?.message || errorData || "Bad request";
        if (
          typeof errorMessage === "string" &&
          errorMessage.toLowerCase().includes("draft") &&
          errorMessage.toLowerCase().includes("already")
        ) {
          toast.error(
            "A draft revision already exists for this venue. You can only have one draft at a time.",
            {
              description:
                "Please complete or delete the existing draft revision before creating a new one.",
              duration: 6000,
            }
          );
          return;
        }

        toast.error(`Failed to create draft revision: ${errorMessage}`);
      } else {
        toast.error("Failed to create draft revision. Please try again.");
      }
    } finally {
      setCreatingRevision(false);
    }
  };

  const handleDeleteRevision = (revision: any) => {
    setRevisionToDelete(revision);
    setDeleteModalOpen(true);
  };

  const handleConfirmDeleteRevision = async () => {
    if (!revisionToDelete) return;

    try {
      setDeletingRevision(true);
      await GraphRevisionService.deleteRevision(revisionToDelete.id);
      toast.success("Revision deleted successfully");
      loadRevisions(venueId);
      setDeleteModalOpen(false);
      setRevisionToDelete(null);
    } catch (err: any) {
      console.error("Failed to delete revision:", err);

      // Handle specific error cases
      if (err.response?.status === 400) {
        const errorData = err.response?.data;
        const errorMessage =
          typeof errorData === "string"
            ? errorData
            : errorData?.message || "Bad request";

        if (
          errorMessage.toLowerCase().includes("only draft") &&
          errorMessage.toLowerCase().includes("deleted")
        ) {
          toast.error("Only draft revisions can be deleted", {
            description: "Published or archived revisions cannot be deleted.",
            duration: 5000,
          });
          return;
        }

        toast.error(`Cannot delete revision: ${errorMessage}`);
      } else if (err.response?.status === 404) {
        toast.error("Revision not found", {
          description: "The revision may have already been deleted.",
          duration: 4000,
        });
        loadRevisions(venueId); // Refresh the list
        setDeleteModalOpen(false);
        setRevisionToDelete(null);
      } else {
        toast.error("Failed to delete revision. Please try again.");
      }
    } finally {
      setDeletingRevision(false);
    }
  };

  const handleEditRevision = (revision: any) => {
    setSelectedRevision(revision);
    setEditModalOpen(true);
  };

  const handleUpdateRevision = (updatedRevision: any) => {
    // Update the revision in the local state
    // The service returns the GraphRevision object directly
    setRevisions((prev) =>
      prev.map((rev) => (rev.id === updatedRevision.id ? updatedRevision : rev))
    );
  };

  // Get venue data (using venueId as name for now - can be enhanced with venue API later)
  const venueName = `Venue ${venueId}`;

  // Transform API data to match UI expectations
  const transformedRevisions = revisions.map((rev, index) => ({
    id: rev.id,
    name:
      rev.status === "published"
        ? "Live Revision"
        : rev.status === "draft"
        ? "Draft Revision"
        : `Version ${revisions.length - index}`,
    version: revisions.length - index,
    status: rev.status,
    isLive: rev.status === "published",
    isDraft: rev.status === "draft",
    createdBy: rev.created_by,
    createdAt: new Date(rev.created_at),
    updatedAt: rev.updated_at
      ? new Date(rev.updated_at)
      : new Date(rev.created_at),
    floorCount: rev.floors?.length || 0, // Use real floor count from revision data
    nodeCount:
      rev.floors?.reduce(
        (total: number, floor: any) => total + (floor.nodes_count || 0),
        0
      ) || 0, // Real node count
    connectionCount: 0, // TODO: Add connection count to API response if needed
    description: rev.note || "No description available",
  }));

  const getStatusBadge = (revision: (typeof transformedRevisions)[0]) => {
    if (revision.isLive) {
      return <Badge className="bg-green-600">Live</Badge>;
    }
    if (revision.isDraft) {
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 border-blue-300"
        >
          Draft
        </Badge>
      );
    }
    return <Badge variant="outline">Archived</Badge>;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/venues/${venueId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">Graph Revisions</h1>
          <p className="text-sm text-muted-foreground">
            Manage navigation graph revisions for {venueName}
          </p>
        </div>
        <Button
          onClick={handleCreateRevision}
          disabled={creatingRevision || hasDraftRevision}
          title={
            hasDraftRevision
              ? "A draft revision already exists. Complete or delete it before creating a new one."
              : ""
          }
        >
          {creatingRevision ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Revision
          {hasDraftRevision && (
            <span className="ml-2 text-xs opacity-75">(Draft exists)</span>
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Revision History
          </CardTitle>
          <CardDescription>
            View and manage all graph revisions for this venue. Each revision
            contains the complete navigation graph data for all floors.
            {hasDraftRevision && (
              <span className="block mt-1 text-blue-600 font-medium">
                ⚠️ A draft revision is currently in progress. Complete or delete
                it before creating a new one.
              </span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading revisions...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Floors</TableHead>
                  <TableHead>Nodes</TableHead>
                  <TableHead>Connections</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Created By</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transformedRevisions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">
                          {error || "No revisions found"}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Create your first revision to get started
                        </p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  transformedRevisions.map((revision) => (
                    <TableRow
                      key={revision.id}
                      className={
                        revision.isDraft ? "bg-blue-50/50 border-blue-200" : ""
                      }
                    >
                      <TableCell className="font-medium">
                        v{revision.version}
                        {revision.isDraft && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Draft
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{revision.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {revision.description}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(revision)}</TableCell>
                      <TableCell>{revision.floorCount}</TableCell>
                      <TableCell>{revision.nodeCount}</TableCell>
                      <TableCell>{revision.connectionCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {revision.updatedAt.toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <User className="h-3 w-3" />
                          {revision.createdBy}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditRevision(revision)}
                          >
                            <Edit className="mr-1 h-3 w-3" />
                            Edit Note
                          </Button>
                          {revision.isDraft && (
                            <Link
                              href={`/dashboard/venues/${venueId}/revision/${revision.id}/editor`}
                            >
                              <Button variant="outline" size="sm">
                                <Eye className="mr-1 h-3 w-3" />
                                Open Editor
                              </Button>
                            </Link>
                          )}
                          {revision.isDraft && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRevision(revision)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Revision Management</CardTitle>
          <CardDescription>
            Understanding graph revisions and their lifecycle
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-green-600">Live Revision</h4>
              <p className="text-sm text-muted-foreground">
                The currently published version visible to users. Only one
                revision can be live at a time.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600">Draft Revision</h4>
              <p className="text-sm text-muted-foreground">
                Work-in-progress versions being edited. Can be promoted to live
                when ready.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-gray-600">Archived Revision</h4>
              <p className="text-sm text-muted-foreground">
                Previous versions kept for history and rollback purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedRevision && (
        <EditRevisionModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          revisionId={selectedRevision.id}
          currentNote={selectedRevision.description || ""}
          onUpdate={handleUpdateRevision}
        />
      )}

      {revisionToDelete && (
        <DeleteRevisionConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setRevisionToDelete(null);
          }}
          orgSlug="acme-corp"
          venueSlug={venueSlug}
          revisionName={revisionToDelete.name}
          onConfirm={handleConfirmDeleteRevision}
          isDeleting={deletingRevision}
        />
      )}
    </div>
  );
}
