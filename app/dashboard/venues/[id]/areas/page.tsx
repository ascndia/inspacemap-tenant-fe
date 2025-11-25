"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Edit,
  Image as ImageIcon,
  MapPin,
  Search,
  Filter,
  Plus,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { venueService } from "@/lib/services/venue-service";
import { areaService } from "@/lib/services/area-service";
import { useAccessControl } from "@/lib/hooks/use-access-control";
import type { VenueDetail } from "@/types/venue";

interface AreaSummary {
  id: string;
  name: string;
  description?: string;
  category: string;
  floor_name: string;
  revision_name: string;
  revision_status: "draft" | "published";
  boundary_points: number;
  cover_image_id?: string;
  gallery_count: number;
  created_at: string;
  updated_at: string;
}

export default function VenueAreasPage() {
  const params = useParams();
  const venueId = params.id as string;
  const { canAccess } = useAccessControl();

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [areas, setAreas] = useState<AreaSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [floorFilter, setFloorFilter] = useState<string>("all");
  const [revisionFilter, setRevisionFilter] = useState<string>("all");

  // Edit dialog state
  const [editingArea, setEditingArea] = useState<AreaSummary | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch venue details
        const venueResponse = await venueService.getVenueById(venueId);
        if (venueResponse.success) {
          setVenue(venueResponse.data);
        }

        // Fetch areas for this venue
        const areasResponse = await areaService.getVenueAreas(venueId);
        if (areasResponse.success) {
          setAreas(areasResponse.data || []);
        } else {
          console.error("Failed to fetch areas:", areasResponse.error);
          setAreas([]);
        }
      } catch (error) {
        console.error("Failed to fetch venue areas:", error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId) {
      fetchData();
    }
  }, [venueId]);

  const filteredAreas = areas.filter((area) => {
    const matchesSearch =
      area.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      area.description?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || area.category === categoryFilter;
    const matchesFloor =
      floorFilter === "all" || area.floor_name === floorFilter;
    const matchesRevision =
      revisionFilter === "all" || area.revision_status === revisionFilter;

    return matchesSearch && matchesCategory && matchesFloor && matchesRevision;
  });

  const handleEditArea = (area: AreaSummary) => {
    setEditingArea(area);
    setEditForm({
      name: area.name,
      description: area.description || "",
      category: area.category,
    });
  };

  const handleSaveArea = async () => {
    if (!editingArea) return;

    try {
      const response = await areaService.updateArea(editingArea.id, editForm);
      if (response.success) {
        // Update local state
        setAreas(
          areas.map((area) =>
            area.id === editingArea.id
              ? { ...area, ...editForm, updated_at: new Date().toISOString() }
              : area
          )
        );
        setEditingArea(null);
      } else {
        console.error("Failed to update area:", response.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Failed to update area:", error);
      // TODO: Show error toast
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      meeting_room: "bg-blue-100 text-blue-800",
      office: "bg-green-100 text-green-800",
      lobby: "bg-yellow-100 text-yellow-800",
      corridor: "bg-gray-100 text-gray-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.default;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading venue areas...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/venues/${venueId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">
            Areas - {venue?.name || "Venue"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage area details, descriptions, and galleries
          </p>
        </div>
        {canAccess("venue:update") && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Area
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search areas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="meeting_room">Meeting Room</SelectItem>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="lobby">Lobby</SelectItem>
                <SelectItem value="corridor">Corridor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={floorFilter} onValueChange={setFloorFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Floors</SelectItem>
                <SelectItem value="Ground Floor">Ground Floor</SelectItem>
                <SelectItem value="2nd Floor">2nd Floor</SelectItem>
              </SelectContent>
            </Select>
            <Select value={revisionFilter} onValueChange={setRevisionFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Revision" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Revisions</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Areas Table */}
      <Card>
        <CardHeader>
          <CardTitle>Areas ({filteredAreas.length})</CardTitle>
          <CardDescription>
            Click on any area to edit details or manage gallery
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Floor</TableHead>
                <TableHead>Revision</TableHead>
                <TableHead>Gallery</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-24">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAreas.map((area) => (
                <TableRow key={area.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{area.name}</div>
                      {area.description && (
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {area.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getCategoryColor(area.category)}>
                      {area.category.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell>{area.floor_name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          area.revision_status === "published"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {area.revision_status}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {area.revision_name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <ImageIcon className="h-4 w-4 text-muted-foreground" />
                      <span>{area.gallery_count}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(area.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditArea(area)}
                        disabled={area.revision_status === "published"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Area Dialog */}
      <Dialog open={!!editingArea} onOpenChange={() => setEditingArea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area Details</DialogTitle>
            <DialogDescription>
              Update the name, description, and category for this area.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Area name"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editForm.description}
                onChange={(e) =>
                  setEditForm({ ...editForm, description: e.target.value })
                }
                placeholder="Area description"
                rows={3}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm({ ...editForm, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting_room">Meeting Room</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="lobby">Lobby</SelectItem>
                  <SelectItem value="corridor">Corridor</SelectItem>
                  <SelectItem value="staircase">Staircase</SelectItem>
                  <SelectItem value="elevator">Elevator</SelectItem>
                  <SelectItem value="entrance">Entrance</SelectItem>
                  <SelectItem value="exit">Exit</SelectItem>
                  <SelectItem value="parking">Parking</SelectItem>
                  <SelectItem value="garden">Garden</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingArea(null)}>
                Cancel
              </Button>
              <Button onClick={handleSaveArea}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
