"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Image as ImageIcon,
  Upload,
  Edit,
  Trash2,
  Star,
  StarOff,
  GripVertical,
  Loader2,
  Save,
  MapPin,
  Building,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { mediaService } from "@/lib/services/media-service";
import { areaService } from "@/lib/services/area-service";
import { MediaPicker } from "@/components/media/media-picker";
import type { MediaItem } from "@/types/media";
import { replaceMinioPort } from "@/lib/utils";
import type {
  AreaEditorDetail,
  AreaGalleryDetail,
} from "@/lib/services/area-service";

interface GalleryItem extends AreaGalleryDetail {
  id: string;
  media_asset_id: string;
  is_featured: boolean;
  media_name: string;
}

export default function AreaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const venueId = params.id as string;
  const areaId = params.areaId as string;

  const [area, setArea] = useState<AreaEditorDetail | null>(null);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [editingArea, setEditingArea] = useState(false);

  // Form state for area editing
  const [areaForm, setAreaForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch complete area details including gallery
        const areaResponse = await areaService.getArea(areaId);
        if (areaResponse.success && areaResponse.data) {
          const areaData = areaResponse.data;
          setArea(areaData);

          // Initialize form
          setAreaForm({
            name: areaData.name,
            description: areaData.description || "",
            category: areaData.category,
          });

          // Transform gallery items to include additional display fields
          const transformedGallery = (areaData.gallery || []).map(
            (item, index) => ({
              ...item,
              id: `item-${index}`,
              media_asset_id: item.media_id,
              is_featured: false, // TODO: Add featured logic if needed
              media_name: `image-${item.media_id}.jpg`,
            })
          );
          setGallery(transformedGallery);
        } else {
          console.error("Failed to fetch area:", areaResponse.error);
        }
      } catch (error) {
        console.error("Failed to fetch area details:", error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId && areaId) {
      fetchData();
    }
  }, [venueId, areaId]);

  const handleSaveArea = async () => {
    if (!area) return;

    try {
      setSaving(true);
      const response = await areaService.updateArea(area.id, {
        name: areaForm.name,
        description: areaForm.description,
        category: areaForm.category,
      });

      if (response.success) {
        setArea({
          ...area,
          name: areaForm.name,
          description: areaForm.description,
          category: areaForm.category,
        });
        setEditingArea(false);
      } else {
        console.error("Failed to update area:", response.error);
      }
    } catch (error) {
      console.error("Failed to save area:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddGalleryItem = async (media: MediaItem) => {
    if (!area) return;

    try {
      const newItem: AreaGalleryDetail = {
        media_id: media.asset_id,
        url: media.url,
        thumbnail_url: media.thumbnail_url || media.url,
        caption: "",
        sort_order: gallery.length,
      };

      // Add to gallery via API
      const response = await areaService.addGalleryItems(area.id, [
        {
          media_asset_id: media.asset_id,
          caption: "",
          sort_order: gallery.length,
          is_visible: true,
        },
      ]);

      if (response.success) {
        const galleryItem: GalleryItem = {
          ...newItem,
          id: `item-${Date.now()}`,
          media_asset_id: media.asset_id,
          is_featured: false,
          media_name: media.name,
        };

        setGallery([...gallery, galleryItem]);
        setShowAddDialog(false);
      }
    } catch (error) {
      console.error("Failed to add gallery item:", error);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<GalleryItem>
  ) => {
    if (!area) return;

    try {
      const item = gallery.find((g) => g.id === itemId);
      if (!item) return;

      // Update via API
      const response = await areaService.updateGalleryItem(
        area.id,
        item.media_asset_id,
        {
          caption: updates.caption,
          is_visible: updates.is_visible,
        }
      );

      if (response.success) {
        setGallery(
          gallery.map((item) =>
            item.id === itemId ? { ...item, ...updates } : item
          )
        );
        setEditingItem(null);
      }
    } catch (error) {
      console.error("Failed to update gallery item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!area) return;
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      const item = gallery.find((g) => g.id === itemId);
      if (!item) return;

      // Delete via API
      const response = await areaService.removeGalleryItem(
        area.id,
        item.media_asset_id
      );

      if (response.success) {
        setGallery(gallery.filter((item) => item.id !== itemId));
      }
    } catch (error) {
      console.error("Failed to delete gallery item:", error);
    }
  };

  const handleReorderItems = async (newOrder: GalleryItem[]) => {
    if (!area) return;

    try {
      const mediaAssetIds = newOrder.map((item) => item.media_asset_id);
      const response = await areaService.reorderGallery(area.id, mediaAssetIds);

      if (response.success) {
        const updatedItems = newOrder.map((item, index) => ({
          ...item,
          sort_order: index,
        }));
        setGallery(updatedItems);
      }
    } catch (error) {
      console.error("Failed to reorder gallery items:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading area details...</span>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Area not found</p>
        <Link href={`/dashboard/venues/${venueId}/areas`}>
          <Button className="mt-4">Back to Areas</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/venues/${venueId}/areas`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">{area.name}</h1>
          <p className="text-sm text-muted-foreground">
            {area.floor_name} • Revision ID: {area.revision_id}
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setEditingArea(true)}
          disabled={saving}
        >
          <Edit className="mr-2 h-4 w-4" />
          Edit Details
        </Button>
      </div>

      {/* Area Details Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Area Details
          </CardTitle>
          <CardDescription>Basic information about this area</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Name</Label>
              <p className="text-sm text-muted-foreground">{area.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Category</Label>
              <p className="text-sm text-muted-foreground capitalize">
                {area.category.replace("_", " ")}
              </p>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">
                {area.description || "No description"}
              </p>
            </div>
            {area.latitude && area.longitude && (
              <div className="md:col-span-2">
                <Label className="text-sm font-medium flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Coordinates
                </Label>
                <p className="text-sm text-muted-foreground">
                  {area.latitude}, {area.longitude}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Gallery Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Gallery ({gallery.length} items)
              </CardTitle>
              <CardDescription>
                Images and media associated with this area
              </CardDescription>
            </div>
            <MediaPicker
              onSelect={handleAddGalleryItem}
              acceptTypes={["image"]}
              trigger={
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Images
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {gallery.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {gallery.map((item, index) => (
                <Card
                  key={item.id}
                  className="group relative overflow-hidden p-0"
                >
                  <CardContent className="p-0">
                    <div className="aspect-square relative overflow-hidden">
                      <Image
                        src={replaceMinioPort(item.url)}
                        alt={item.caption || item.media_name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                      />

                      {/* Overlay with actions */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Sort order indicator */}
                      <div className="absolute top-2 left-2">
                        <Badge variant="secondary" className="text-xs">
                          #{item.sort_order + 1}
                        </Badge>
                      </div>
                    </div>

                    {/* Caption */}
                    {item.caption && (
                      <div className="p-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.caption}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No gallery items yet</h3>
              <p className="text-muted-foreground mb-4">
                Add images to showcase this area
              </p>
              <MediaPicker
                onSelect={handleAddGalleryItem}
                acceptTypes={["image"]}
                trigger={
                  <Button>
                    <Upload className="mr-2 h-4 w-4" />
                    Add First Image
                  </Button>
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Area Dialog */}
      <Dialog open={editingArea} onOpenChange={setEditingArea}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Area Details</DialogTitle>
            <DialogDescription>
              Update the basic information for this area.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={areaForm.name}
                onChange={(e) =>
                  setAreaForm({ ...areaForm, name: e.target.value })
                }
                placeholder="Area name"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={areaForm.category}
                onChange={(e) =>
                  setAreaForm({ ...areaForm, category: e.target.value })
                }
                placeholder="meeting_room, office, etc."
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={areaForm.description}
                onChange={(e) =>
                  setAreaForm({ ...areaForm, description: e.target.value })
                }
                placeholder="Area description"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingArea(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveArea} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Gallery Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={() => setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Gallery Item</DialogTitle>
            <DialogDescription>
              Update the caption and visibility settings for this image.
            </DialogDescription>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div className="aspect-square relative overflow-hidden rounded-lg">
                <Image
                  src={replaceMinioPort(editingItem.url)}
                  alt={editingItem.caption || editingItem.media_name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Caption</label>
                <Textarea
                  value={editingItem.caption || ""}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, caption: e.target.value })
                  }
                  placeholder="Add a caption for this image"
                  rows={3}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingItem(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => handleUpdateItem(editingItem.id, editingItem)}
                >
                  Save Changes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
