"use client";

import { mockVenues } from "@/lib/api";
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

interface VenueRevisionsPageProps {
  params: Promise<{ id: string }>;
}

export default function VenueRevisionsPage({
  params,
}: VenueRevisionsPageProps) {
  const [venueId, setVenueId] = useState<string>("");
  const [revisions, setRevisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingRevision, setCreatingRevision] = useState(false);
  const router = useRouter();

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => {
      setVenueId(id);
      loadRevisions(id);
    });
  }, [params]);

  const loadRevisions = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await GraphRevisionService.getRevisions(id);
      setRevisions(data);
    } catch (err) {
      console.error("Failed to load revisions:", err);
      setError("Failed to load revisions");
      // Fallback to mock data
      setRevisions([
        {
          id: "rev-1",
          venue_id: id,
          status: "published",
          note: "Current live version with all floors mapped",
          created_at: new Date("2024-01-15").toISOString(),
          created_by: "John Doe",
          updated_at: new Date("2024-01-20").toISOString(),
        },
        {
          id: "rev-2",
          venue_id: id,
          status: "draft",
          note: "Working on new floor additions and updates",
          created_at: new Date("2024-01-18").toISOString(),
          created_by: "Jane Smith",
          updated_at: new Date("2024-01-22").toISOString(),
        },
      ]);
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
    } catch (err) {
      console.error("Failed to create revision:", err);
      toast.error("Failed to create draft revision");
    } finally {
      setCreatingRevision(false);
    }
  };

  const handleDeleteRevision = async (revisionId: string) => {
    try {
      await GraphRevisionService.deleteRevision(revisionId);
      toast.success("Revision deleted successfully");
      loadRevisions(venueId);
    } catch (err) {
      console.error("Failed to delete revision:", err);
      toast.error("Failed to delete revision");
    }
  };

  // Get venue data (keeping mock for now)
  const venue = mockVenues.find((v) => v.id === venueId) || mockVenues[0];

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
    floorCount: venue?.floors.length || 0,
    nodeCount:
      rev.status === "published" ? 45 : rev.status === "draft" ? 52 : 32,
    connectionCount:
      rev.status === "published" ? 38 : rev.status === "draft" ? 45 : 28,
    description: rev.note || "No description available",
  }));

  const getStatusBadge = (revision: (typeof transformedRevisions)[0]) => {
    if (revision.isLive) {
      return <Badge className="bg-green-600">Live</Badge>;
    }
    if (revision.isDraft) {
      return <Badge variant="secondary">Draft</Badge>;
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
            Manage navigation graph revisions for {venue?.name || "Venue"}
          </p>
        </div>
        <Button onClick={handleCreateRevision} disabled={creatingRevision}>
          {creatingRevision ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          New Revision
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
                    <TableRow key={revision.id}>
                      <TableCell className="font-medium">
                        v{revision.version}
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
                          <Link
                            href={`/dashboard/venues/${venueId}/revision/${revision.id}/editor`}
                          >
                            <Button variant="outline" size="sm">
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                          </Link>
                          <Button variant="outline" size="sm">
                            <Eye className="mr-1 h-3 w-3" />
                            Preview
                          </Button>
                          {revision.isDraft && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                              onClick={() => handleDeleteRevision(revision.id)}
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
    </div>
  );
}
