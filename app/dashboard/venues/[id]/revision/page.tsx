import { mockVenues } from "@/lib/api";
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
} from "lucide-react";
import Link from "next/link";

export default async function VenueRevisionsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  // Mock revision data - in real app, this would come from API
  const mockRevisions = [
    {
      id: "rev-1",
      name: "Live Revision",
      version: 3,
      status: "live",
      isLive: true,
      isDraft: false,
      createdBy: "John Doe",
      createdAt: new Date("2024-01-15"),
      updatedAt: new Date("2024-01-20"),
      floorCount: venue.floors.length,
      nodeCount: 45,
      connectionCount: 38,
      description: "Current live version with all floors mapped",
    },
    {
      id: "rev-2",
      name: "Draft Revision",
      version: 4,
      status: "draft",
      isLive: false,
      isDraft: true,
      createdBy: "Jane Smith",
      createdAt: new Date("2024-01-18"),
      updatedAt: new Date("2024-01-22"),
      floorCount: venue.floors.length,
      nodeCount: 52,
      connectionCount: 45,
      description: "Working on new floor additions and updates",
    },
    {
      id: "rev-3",
      name: "Version 2",
      version: 2,
      status: "archived",
      isLive: false,
      isDraft: false,
      createdBy: "John Doe",
      createdAt: new Date("2024-01-10"),
      updatedAt: new Date("2024-01-14"),
      floorCount: venue.floors.length - 1,
      nodeCount: 32,
      connectionCount: 28,
      description: "Previous stable version",
    },
    {
      id: "rev-4",
      name: "Initial Version",
      version: 1,
      status: "archived",
      isLive: false,
      isDraft: false,
      createdBy: "John Doe",
      createdAt: new Date("2024-01-05"),
      updatedAt: new Date("2024-01-08"),
      floorCount: venue.floors.length - 1,
      nodeCount: 18,
      connectionCount: 15,
      description: "First version with basic navigation",
    },
  ];

  const getStatusBadge = (revision: (typeof mockRevisions)[0]) => {
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
        <Link href={`/dashboard/venues/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">Graph Revisions</h1>
          <p className="text-sm text-muted-foreground">
            Manage navigation graph revisions for {venue.name}
          </p>
        </div>
        <Link href={`/dashboard/venues/${id}/revision/new/editor`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Revision
          </Button>
        </Link>
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
              {mockRevisions.map((revision) => (
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
                        href={`/dashboard/venues/${id}/revision/${revision.id}/editor`}
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
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
