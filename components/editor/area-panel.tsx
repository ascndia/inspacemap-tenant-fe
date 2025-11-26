"use client";

import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAllAreas } from "@/hooks/useGraphData";
import { useGraphContext } from "@/providers/GraphProvider";
import { useGraph } from "@/providers/GraphProvider";
import { useGraphStore } from "@/stores/graph-store";
import { Area } from "@/types/graph";
import { Edit, Trash2, ExternalLink, Search, Filter } from "lucide-react";
import { useRouter } from "next/navigation";

export function AreaPanel() {
  const graphStore = useGraphStore();
  const graphProvider = useGraph();
  const router = useRouter();

  // Get venueId and revisionId from context
  const { venueId, revisionId, floorId } = useGraphContext();

  const { graph, selectedAreaId, setSelectedArea } = graphStore;
  const { updateArea, deleteArea } = graphProvider;

  const [searchTerm, setSearchTerm] = useState("");
  const [filterFloor, setFilterFloor] = useState("current"); // "current" or "all"
  const [editingArea, setEditingArea] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  // Get areas from current graph (current floor)
  const currentFloorAreas = graph?.areas || [];

  // Get all areas when filter is "all"
  const { data: allAreas = [], isLoading: isLoadingAllAreas } = useAllAreas(
    venueId || "",
    revisionId || ""
  );

  // Determine which areas to show based on filter
  const areas = useMemo(() => {
    let filteredAreas = filterFloor === "all" ? allAreas : currentFloorAreas;

    // Apply search filter
    if (searchTerm) {
      filteredAreas = filteredAreas.filter(
        (area) =>
          area.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          area.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          area.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort areas: areas with boundaries first, then by name
    return filteredAreas.sort((a, b) => {
      const aHasBoundary = a.boundary && a.boundary.length > 0;
      const bHasBoundary = b.boundary && b.boundary.length > 0;

      if (aHasBoundary && !bHasBoundary) return -1;
      if (!aHasBoundary && bHasBoundary) return 1;

      return a.name.localeCompare(b.name);
    });
  }, [currentFloorAreas, allAreas, searchTerm, filterFloor]);

  const handleSelectArea = (area: Area) => {
    setSelectedArea(area.id);
  };

  const handleEditArea = (area: Area) => {
    if (filterFloor === "all" && area.floorId !== floorId) {
      alert(
        "Can only edit areas on the current floor. Switch to the area's floor to edit it."
      );
      return;
    }
    setEditingArea(area.id);
    setEditForm({
      name: area.name,
      description: area.description || "",
      category: area.category,
    });
  };

  const handleSaveEdit = async () => {
    if (!editingArea) return;

    try {
      await updateArea(editingArea, editForm);
      setEditingArea(null);
    } catch (error) {
      console.error("Failed to update area:", error);
    }
  };

  const handleCancelEdit = () => {
    setEditingArea(null);
    setEditForm({ name: "", description: "", category: "" });
  };

  const handleDeleteArea = async (areaId: string) => {
    const area = areas.find((a) => a.id === areaId);
    if (filterFloor === "all" && area && area.floorId !== floorId) {
      alert(
        "Can only delete areas on the current floor. Switch to the area's floor to delete it."
      );
      return;
    }

    if (!confirm("Are you sure you want to delete this area?")) return;

    try {
      await deleteArea(areaId);
    } catch (error) {
      console.error("Failed to delete area:", error);
    }
  };

  const handleViewAreaDetail = (areaId: string) => {
    // Navigate to area detail page
    router.push(`/venues/${venueId}/areas/${areaId}`);
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      meeting_room: "bg-blue-100 text-blue-800",
      office: "bg-green-100 text-green-800",
      lobby: "bg-purple-100 text-purple-800",
      dining: "bg-orange-100 text-orange-800",
      entertainment: "bg-pink-100 text-pink-800",
      service: "bg-yellow-100 text-yellow-800",
      default: "bg-gray-100 text-gray-800",
    };
    return colors[category] || colors.default;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Area Management</h3>
      </div>

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-hidden">
        {/* Search and Filter */}
        <div className="space-y-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search areas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterFloor} onValueChange={setFilterFloor}>
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Floor</SelectItem>
                <SelectItem value="all">All Floors</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="shrink-0" />

        {/* Areas List */}
        <div className="flex-1 overflow-y-auto space-y-2 p-1">
          {filterFloor === "all" && isLoadingAllAreas ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              Loading areas from all floors...
            </div>
          ) : areas.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm py-8">
              No areas found
            </div>
          ) : (
            areas.map((area) => (
              <Card
                key={area.id}
                className={`cursor-pointer transition-colors ${
                  selectedAreaId === area.id
                    ? "ring-2 ring-primary"
                    : "hover:bg-muted/50"
                }`}
                onClick={() => handleSelectArea(area)}
              >
                <CardContent className="p-3">
                  {editingArea === area.id ? (
                    <div className="space-y-2">
                      <Input
                        value={editForm.name}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        placeholder="Area name"
                      />
                      <Input
                        value={editForm.description}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            description: e.target.value,
                          }))
                        }
                        placeholder="Description"
                      />
                      <Select
                        value={editForm.category}
                        onValueChange={(value) =>
                          setEditForm((prev) => ({
                            ...prev,
                            category: value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="meeting_room">
                            Meeting Room
                          </SelectItem>
                          <SelectItem value="office">Office</SelectItem>
                          <SelectItem value="lobby">Lobby</SelectItem>
                          <SelectItem value="dining">Dining</SelectItem>
                          <SelectItem value="entertainment">
                            Entertainment
                          </SelectItem>
                          <SelectItem value="service">Service</SelectItem>
                          <SelectItem value="default">Default</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={handleSaveEdit}>
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{area.name}</h4>
                          {area.description && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {area.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            disabled={
                              filterFloor === "all" && area.floorId !== floorId
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditArea(area);
                            }}
                            title={
                              filterFloor === "all" && area.floorId !== floorId
                                ? "Can only edit areas on current floor"
                                : "Edit area"
                            }
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                            disabled={
                              filterFloor === "all" && area.floorId !== floorId
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteArea(area.id);
                            }}
                            title={
                              filterFloor === "all" && area.floorId !== floorId
                                ? "Can only delete areas on current floor"
                                : "Delete area"
                            }
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAreaDetail(area.id);
                            }}
                            title="View area details"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getCategoryColor(
                            area.category
                          )}`}
                        >
                          {area.category.replace("_", " ")}
                        </Badge>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          {filterFloor === "all" && (
                            <span className="text-blue-600">
                              Floor {area.floorId.slice(-4)}
                            </span>
                          )}
                          {area.boundary && area.boundary.length > 0 ? (
                            <span className="text-green-600">
                              {area.boundary.length} vertices
                            </span>
                          ) : (
                            <span className="text-orange-600">No boundary</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
