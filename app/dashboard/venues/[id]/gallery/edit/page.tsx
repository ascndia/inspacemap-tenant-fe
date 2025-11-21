"use client";

import { useState, useEffect } from "react";
import { mockVenues, mockMedia } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Upload, Check } from "lucide-react";
import Link from "next/link";
import { GalleryImageItem } from "@/components/venues/gallery-image-item";
import { MediaPicker } from "@/components/media/media-picker";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  name: string;
  size: string;
  uploadedAt: string;
  isCover: boolean;
}

interface GallerySettings {
  sortOrder: string;
  displayMode: string;
  coverImageId: string;
}

export default function VenueGalleryEditPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { id } = params;

  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  // Gallery state
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([
    {
      id: "1",
      url: "/placeholder-image.jpg",
      alt: "Venue main hall",
      name: "Main Hall",
      size: "2.3 MB",
      uploadedAt: "2024-01-15",
      isCover: true,
    },
    {
      id: "2",
      url: "/placeholder-image.jpg",
      alt: "Conference room",
      name: "Conference Room",
      size: "1.8 MB",
      uploadedAt: "2024-01-14",
      isCover: false,
    },
    {
      id: "3",
      url: "/placeholder-image.jpg",
      alt: "Lobby area",
      name: "Lobby",
      size: "3.1 MB",
      uploadedAt: "2024-01-13",
      isCover: false,
    },
    {
      id: "4",
      url: "/placeholder-image.jpg",
      alt: "Outdoor space",
      name: "Outdoor Space",
      size: "2.7 MB",
      uploadedAt: "2024-01-12",
      isCover: false,
    },
  ]);

  const [settings, setSettings] = useState<GallerySettings>({
    sortOrder: "manual",
    displayMode: "grid",
    coverImageId: "1",
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Calculate stats
  const totalSize = galleryImages.reduce((sum, img) => {
    const size = parseFloat(img.size);
    return sum + size;
  }, 0);

  const coverImage = galleryImages.find(img => img.isCover);

  // Handlers
  const handleMoveUp = (index: number) => {
    if (index === 0) return;

    const newImages = [...galleryImages];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setGalleryImages(newImages);
    setHasChanges(true);
  };

  const handleMoveDown = (index: number) => {
    if (index === galleryImages.length - 1) return;

    const newImages = [...galleryImages];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setGalleryImages(newImages);
    setHasChanges(true);
  };

  const handleSetCover = (imageId: string) => {
    const newImages = galleryImages.map(img => ({
      ...img,
      isCover: img.id === imageId,
    }));
    setGalleryImages(newImages);
    setSettings(prev => ({ ...prev, coverImageId: imageId }));
    setHasChanges(true);
  };

  const handleRemove = (imageId: string) => {
    const newImages = galleryImages.filter(img => img.id !== imageId);
    setGalleryImages(newImages);
    setHasChanges(true);

    // If we removed the cover image, set the first image as cover
    const wasCover = galleryImages.find(img => img.id === imageId)?.isCover;
    if (wasCover && newImages.length > 0) {
      newImages[0].isCover = true;
      setSettings(prev => ({ ...prev, coverImageId: newImages[0].id }));
    }
  };

  const handleAddImages = (selectedMedia: any) => {
    // Convert selected media to gallery images
    const newImages: GalleryImage[] = Array.isArray(selectedMedia)
      ? selectedMedia.map((media: any, index: number) => ({
          id: `new-${Date.now()}-${index}`,
          url: media.url || "/placeholder-image.jpg",
          alt: media.name || "New image",
          name: media.name || `Image ${galleryImages.length + index + 1}`,
          size: media.size || "1.0 MB",
          uploadedAt: new Date().toISOString().split('T')[0],
          isCover: false,
        }))
      : [{
          id: `new-${Date.now()}`,
          url: selectedMedia.url || "/placeholder-image.jpg",
          alt: selectedMedia.name || "New image",
          name: selectedMedia.name || `Image ${galleryImages.length + 1}`,
          size: selectedMedia.size || "1.0 MB",
          uploadedAt: new Date().toISOString().split('T')[0],
          isCover: false,
        }];

    setGalleryImages(prev => [...prev, ...newImages]);
    setHasChanges(true);
    toast.success(`${newImages.length} image(s) added to gallery`);
  };

  const handleSave = async () => {
    setIsSaving(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // In a real app, save to backend
      console.log("Saving gallery:", {
        venueId: id,
        images: galleryImages,
        settings,
      });

      setHasChanges(false);
      toast.success("Gallery saved successfully!");
      router.push(`/dashboard/venues/${id}/gallery`);
    } catch (error) {
      toast.error("Failed to save gallery");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof GallerySettings, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;

    const newImages = [...galleryImages];
    const [draggedItem] = newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedItem);

    setGalleryImages(newImages);
    setDraggedIndex(null);
    setHasChanges(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/venues/${id}/gallery`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">
            Edit Gallery - {venue.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Reorder images, set cover image, and manage gallery settings
          </p>
        </div>
        <Button onClick={handleSave} disabled={!hasChanges || isSaving}>
          {isSaving ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Gallery Editor */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gallery Images</CardTitle>
                  <CardDescription>
                    Drag and drop to reorder images. The first image will be
                    used as the cover.
                  </CardDescription>
                </div>
                <MediaPicker
                  onSelect={handleAddImages}
                  trigger={
                    <Button>
                      <Upload className="mr-2 h-4 w-4" />
                      Add Images
                    </Button>
                  }
                  multiple={true}
                  acceptTypes={["image"]}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {galleryImages.map((image, index) => (
                  <GalleryImageItem
                    key={image.id}
                    image={image}
                    index={index}
                    isFirst={index === 0}
                    onMoveUp={() => handleMoveUp(index)}
                    onMoveDown={() => handleMoveDown(index)}
                    onSetCover={() => handleSetCover(image.id)}
                    onRemove={() => handleRemove(image.id)}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    isDragging={draggedIndex === index}
                  />
                ))}

                {galleryImages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Upload className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-medium">No images yet</h3>
                    <p className="text-sm mt-1">
                      Add some images to get started
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Gallery Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sort Order</label>
                <Select
                  value={settings.sortOrder}
                  onValueChange={(value) => handleSettingChange("sortOrder", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual (Drag & Drop)</SelectItem>
                    <SelectItem value="alphabetical">Alphabetical</SelectItem>
                    <SelectItem value="date-newest">Newest First</SelectItem>
                    <SelectItem value="date-oldest">Oldest First</SelectItem>
                    <SelectItem value="size-largest">Largest First</SelectItem>
                    <SelectItem value="size-smallest">
                      Smallest First
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Display Mode</label>
                <Select
                  value={settings.displayMode}
                  onValueChange={(value) => handleSettingChange("displayMode", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid View</SelectItem>
                    <SelectItem value="masonry">Masonry</SelectItem>
                    <SelectItem value="carousel">Carousel</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Cover Image</label>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1" />
                    {coverImage?.name || "None"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  The cover image is displayed prominently in venue listings
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Gallery Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Total Images:</span>
                <span className="font-medium">{galleryImages.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Size:</span>
                <span className="font-medium">{totalSize.toFixed(1)} MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated:</span>
                <span className="font-medium">Now</span>
              </div>
              {hasChanges && (
                <div className="flex items-center gap-2 text-sm text-amber-600">
                  <div className="w-2 h-2 bg-amber-500 rounded-full" />
                  Unsaved changes
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
