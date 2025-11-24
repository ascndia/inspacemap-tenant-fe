"use client";

import React, { useState, useEffect } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Trash2,
  Maximize2,
  MoreVertical,
  Edit,
  Star,
  StarOff,
  GripVertical,
} from "lucide-react";
import { venueService } from "@/lib/services/venue-service";
import type { VenueGalleryItem } from "@/types/venue";
import type { MediaItem } from "@/types/media";
import { toast } from "sonner";

interface VenueGalleryProps {
  venueId: string;
  galleryItems: VenueGalleryItem[];
  onUpdate: () => void;
}

export function VenueGallery({
  venueId,
  galleryItems,
  onUpdate,
}: VenueGalleryProps) {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VenueGalleryItem | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [draggedItem, setDraggedItem] = useState<VenueGalleryItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  console.log(galleryItems);

  const handleAddImages = async (selectedMedia: MediaItem | MediaItem[]) => {
    // Handle both single media item and array of media items
    const mediaArray = Array.isArray(selectedMedia)
      ? selectedMedia
      : [selectedMedia];

    if (mediaArray.length === 0) return;

    try {
      setIsSubmitting(true);

      // Create gallery items from selected media
      const items: VenueGalleryItem[] = mediaArray.map((media, index) => ({
        media_id: media.id,
        url: media.url,
        thumbnail_url: media.thumbnail_url || "",
        sort_order: galleryItems.length + index,
        caption: "",
        is_visible: true,
        is_featured: false,
      }));

      const response = await venueService.addGalleryItems(venueId, { items });

      if (response.success) {
        toast.success(`Added ${mediaArray.length} image(s) to gallery`);
        onUpdate();
        setIsMediaPickerOpen(false);
      } else {
        toast.error(response.error || "Failed to add images");
      }
    } catch (error: any) {
      console.error("Error adding gallery items:", error);
      toast.error("Failed to add images to gallery");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveItem = async (mediaId: string) => {
    try {
      setIsSubmitting(true);
      const response = await venueService.removeGalleryItem(venueId, mediaId);

      if (response.success) {
        toast.success("Image removed from gallery");
        onUpdate();
      } else {
        toast.error(response.error || "Failed to remove image");
      }
    } catch (error: any) {
      console.error("Error removing gallery item:", error);
      toast.error("Failed to remove image from gallery");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditItem = (item: VenueGalleryItem) => {
    setEditingItem(item);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async (updatedItem: VenueGalleryItem) => {
    if (!editingItem) return;

    try {
      setIsSubmitting(true);
      const response = await venueService.updateGalleryItem(
        venueId,
        editingItem.media_id,
        {
          caption: updatedItem.caption,
          is_featured: updatedItem.is_featured,
          sort_order: updatedItem.sort_order,
          is_visible: updatedItem.is_visible,
        }
      );

      if (response.success) {
        toast.success("Gallery item updated");
        onUpdate();
        setIsEditDialogOpen(false);
        setEditingItem(null);
      } else {
        toast.error(response.error || "Failed to update item");
      }
    } catch (error: any) {
      console.error("Error updating gallery item:", error);
      toast.error("Failed to update gallery item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, item: VenueGalleryItem) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (!draggedItem) return;

    const draggedIndex = sortedItems.findIndex(
      (item) => item.media_id === draggedItem.media_id
    );
    if (draggedIndex === -1 || draggedIndex === dropIndex) return;

    // Create new order
    const newItems = [...sortedItems];
    const [removed] = newItems.splice(draggedIndex, 1);
    newItems.splice(dropIndex, 0, removed);

    // Update sort orders
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      sort_order: index,
    }));

    // Update backend
    const mediaIds = reorderedItems.map((item) => item.media_id);
    await handleReorder(mediaIds);

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleReorder = async (newOrder: string[]) => {
    try {
      setIsSubmitting(true);
      const response = await venueService.reorderGallery(venueId, {
        media_ids: newOrder,
      });

      if (response.success) {
        toast.success("Gallery reordered");
        onUpdate();
      } else {
        toast.error(response.error || "Failed to reorder gallery");
      }
    } catch (error: any) {
      console.error("Error reordering gallery:", error);
      toast.error("Failed to reorder gallery");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sort gallery items by sort_order
  const sortedItems = [...galleryItems].sort(
    (a, b) => (a.sort_order || 0) - (b.sort_order || 0)
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gallery Images</h3>
        <MediaPicker
          onSelect={handleAddImages}
          multiple={true}
          acceptTypes={["image"]}
          trigger={
            <Button disabled={isSubmitting}>
              <Maximize2 className="mr-2 h-4 w-4" />
              Add Images
            </Button>
          }
        />
      </div>

      {sortedItems.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Maximize2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No images in gallery yet</p>
          <p className="text-sm">Add images to showcase your venue</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedItems.map((item, index) => (
            <div
              key={`${item.media_id}-${item.sort_order || 0}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`transition-all duration-200 ${
                dragOverIndex === index
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              } ${draggedItem?.media_id === item.media_id ? "opacity-50" : ""}`}
            >
              <GalleryItemCard
                item={item}
                onEdit={handleEditItem}
                onRemove={handleRemoveItem}
                isSubmitting={isSubmitting}
              />
            </div>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <EditGalleryItemDialog
        item={editingItem}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSave={handleSaveEdit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

interface GalleryItemCardProps {
  item: VenueGalleryItem;
  onEdit: (item: VenueGalleryItem) => void;
  onRemove: (mediaId: string) => void;
  isSubmitting: boolean;
}

function GalleryItemCard({
  item,
  onEdit,
  onRemove,
  isSubmitting,
}: GalleryItemCardProps) {
  // Use actual image URL if available, otherwise placeholder
  const imageUrl = item.thumbnail_url || item.url || "/placeholder.svg";

  return (
    <Card className="overflow-hidden space-y-0 group py-0 relative cursor-move">
      <div className="aspect-square bg-muted relative">
        {/* Actual Image */}
        <img
          src={imageUrl}
          alt={item.caption || "Gallery image"}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to placeholder if image fails to load
            (e.target as HTMLImageElement).src = "/placeholder.svg";
          }}
        />

        {/* Status badges */}
        <div className="absolute top-2 left-2 flex gap-1">
          {item.is_featured && (
            <Badge variant="default" className="text-xs">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
          {!item.is_visible && (
            <Badge variant="secondary" className="text-xs">
              Hidden
            </Badge>
          )}
        </div>

        {/* Drag handle */}
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <GripVertical className="h-4 w-4 text-muted-foreground bg-background/80 rounded p-0.5" />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(item)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onRemove(item.media_id)}
                disabled={isSubmitting}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CardContent className="p-2 pt-0">
        <p className="text-xs font-medium truncate">
          {item.caption || "Untitled"}
        </p>
        <p className="text-xs text-muted-foreground">
          Order: {item.sort_order || 0}
        </p>
      </CardContent>
    </Card>
  );
}

interface EditGalleryItemDialogProps {
  item: VenueGalleryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (item: VenueGalleryItem) => void;
  isSubmitting: boolean;
}

function EditGalleryItemDialog({
  item,
  open,
  onOpenChange,
  onSave,
  isSubmitting,
}: EditGalleryItemDialogProps) {
  const [caption, setCaption] = useState(item?.caption || "");
  const [sortOrder, setSortOrder] = useState(item?.sort_order || 0);
  const [isVisible, setIsVisible] = useState(item?.is_visible ?? true);
  const [isFeatured, setIsFeatured] = useState(item?.is_featured ?? false);

  // Reset form when item changes
  React.useEffect(() => {
    if (item) {
      setCaption(item.caption || "");
      setSortOrder(item.sort_order || 0);
      setIsVisible(item.is_visible ?? true);
      setIsFeatured(item.is_featured ?? false);
    }
  }, [item]);

  const handleSave = () => {
    if (!item) return;
    onSave({
      ...item,
      caption,
      sort_order: sortOrder,
      is_visible: isVisible,
      is_featured: isFeatured,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Gallery Item</DialogTitle>
          <DialogDescription>
            Update the properties of this gallery image.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Enter image caption..."
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="sortOrder">Sort Order</Label>
            <Input
              id="sortOrder"
              type="number"
              value={sortOrder}
              onChange={(e) => setSortOrder(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isVisible"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isVisible">Visible in gallery</Label>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isFeatured"
              checked={isFeatured}
              onChange={(e) => setIsFeatured(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="isFeatured">Featured image</Label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
