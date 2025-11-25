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
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { mediaService } from "@/lib/services/media-service";
import { areaService } from "@/lib/services/area-service";
import { MediaPicker } from "@/components/media/media-picker";
import type { MediaItem } from "@/types/media";
import { replaceMinioPort } from "@/lib/utils";

interface AreaGalleryItem {
  id: string;
  media_asset_id: string;
  caption?: string;
  sort_order: number;
  is_visible: boolean;
  is_featured: boolean;
  media_url: string;
  media_name: string;
}

interface AreaInfo {
  id: string;
  name: string;
  description?: string;
  floor_name: string;
  revision_name: string;
  revision_status: "draft" | "published";
}

export default function AreaGalleryPage() {
  const params = useParams();
  const venueId = params.id as string;
  const areaId = params.areaId as string;

  const [area, setArea] = useState<AreaInfo | null>(null);
  const [gallery, setGallery] = useState<AreaGalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingItem, setEditingItem] = useState<AreaGalleryItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch area details and gallery
        const areaResponse = await areaService.getArea(areaId);
        if (areaResponse.success && areaResponse.data) {
          const areaData = areaResponse.data;
          setArea({
            id: areaData.id,
            name: areaData.name,
            description: areaData.description,
            floor_name: "Unknown Floor", // TODO: Get from API or pass from areas list
            revision_name: "Unknown Revision", // TODO: Get from API or pass from areas list
            revision_status: "draft", // TODO: Get from API or pass from areas list
          });

          // Transform gallery items to include additional display fields
          // Note: This assumes gallery includes media URLs, but API might need separate calls
          const transformedGallery = (areaData.gallery || []).map(
            (item, index) => ({
              id: `item-${index}`,
              media_asset_id: item.media_asset_id,
              caption: item.caption,
              sort_order: item.sort_order,
              is_visible: item.is_visible,
              is_featured: item.is_featured || false,
              media_url: "/placeholder.svg", // TODO: Get actual media URL from media service
              media_name: `image-${item.media_asset_id}.jpg`, // TODO: Get actual media name
            })
          );
          setGallery(transformedGallery);
        } else {
          console.error("Failed to fetch area:", areaResponse.error);
        }
      } catch (error) {
        console.error("Failed to fetch area gallery:", error);
      } finally {
        setLoading(false);
      }
    };

    if (venueId && areaId) {
      fetchData();
    }
  }, [venueId, areaId]);

  const handleAddGalleryItem = async (media: MediaItem) => {
    try {
      // API call to add gallery item
      const newItem: AreaGalleryItem = {
        id: `item-${Date.now()}`,
        media_asset_id: media.asset_id,
        caption: "",
        sort_order: gallery.length,
        is_visible: true,
        is_featured: false,
        media_url: media.url,
        media_name: media.name,
      };

      setGallery([...gallery, newItem]);
      setShowAddDialog(false);
    } catch (error) {
      console.error("Failed to add gallery item:", error);
    }
  };

  const handleUpdateItem = async (
    itemId: string,
    updates: Partial<AreaGalleryItem>
  ) => {
    try {
      // API call to update gallery item
      setGallery(
        gallery.map((item) =>
          item.id === itemId ? { ...item, ...updates } : item
        )
      );
      setEditingItem(null);
    } catch (error) {
      console.error("Failed to update gallery item:", error);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm("Are you sure you want to delete this gallery item?")) return;

    try {
      // API call to delete gallery item
      setGallery(gallery.filter((item) => item.id !== itemId));
    } catch (error) {
      console.error("Failed to delete gallery item:", error);
    }
  };

  const handleReorderItems = async (newOrder: AreaGalleryItem[]) => {
    try {
      // API call to reorder gallery items
      const updatedItems = newOrder.map((item, index) => ({
        ...item,
        sort_order: index,
      }));
      setGallery(updatedItems);
    } catch (error) {
      console.error("Failed to reorder gallery items:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading area gallery...</span>
      </div>
    );
  }

  if (!area) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Area not found</p>
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
          <h1 className="text-lg font-semibold md:text-2xl">
            Gallery - {area.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            {area.floor_name} • {area.revision_name}
          </p>
        </div>
        <MediaPicker
          onSelect={handleAddGalleryItem}
          acceptTypes={["image"]}
          trigger={
            <Button disabled={area.revision_status === "published"}>
              <Upload className="mr-2 h-4 w-4" />
              Add Images
            </Button>
          }
        />
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {gallery.map((item, index) => (
          <Card key={item.id} className="group relative overflow-hidden">
            <CardContent className="p-0">
              <div className="aspect-square relative overflow-hidden">
                <Image
                  src={replaceMinioPort(item.media_url)}
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
                    disabled={area.revision_status === "published"}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() =>
                      handleUpdateItem(item.id, {
                        is_featured: !item.is_featured,
                      })
                    }
                    disabled={area.revision_status === "published"}
                  >
                    {item.is_featured ? (
                      <StarOff className="h-4 w-4" />
                    ) : (
                      <Star className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    disabled={area.revision_status === "published"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                {/* Featured badge */}
                {item.is_featured && (
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-yellow-500 text-black">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  </div>
                )}

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

      {gallery.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No gallery items yet</h3>
            <p className="text-muted-foreground mb-4">
              Add images to showcase this area
            </p>
            <MediaPicker
              onSelect={handleAddGalleryItem}
              acceptTypes={["image"]}
              trigger={
                <Button disabled={area.revision_status === "published"}>
                  <Upload className="mr-2 h-4 w-4" />
                  Add First Image
                </Button>
              }
            />
          </CardContent>
        </Card>
      )}

      {/* Edit Item Dialog */}
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
                  src={replaceMinioPort(editingItem.media_url)}
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

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_visible"
                  checked={editingItem.is_visible}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      is_visible: e.target.checked,
                    })
                  }
                />
                <label htmlFor="is_visible" className="text-sm">
                  Visible in gallery
                </label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_featured"
                  checked={editingItem.is_featured}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      is_featured: e.target.checked,
                    })
                  }
                />
                <label htmlFor="is_featured" className="text-sm">
                  Featured image
                </label>
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
