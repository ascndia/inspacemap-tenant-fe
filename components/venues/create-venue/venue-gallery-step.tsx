"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MediaPicker } from "@/components/media/media-picker";
import { X, Upload, ImageIcon, Star } from "lucide-react";
import { cn } from "@/lib/utils";

// Controlled MediaPicker wrapper
function ControlledMediaPicker({
  open,
  onOpenChange,
  onSelect,
  multiple = false,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (media: any) => void;
  multiple?: boolean;
  children: React.ReactNode;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open && triggerRef.current) {
      triggerRef.current.click();
    }
  }, [open]);

  return (
    <MediaPicker
      onSelect={(media) => {
        onSelect(media);
        onOpenChange(false);
      }}
      multiple={multiple}
      trigger={
        <button ref={triggerRef} style={{ display: "none" }}>
          {children}
        </button>
      }
    />
  );
}

interface VenueGalleryStepProps {
  data: {
    coverImageId: string | null;
    galleryItems: string[];
  };
  onUpdate: (updates: Partial<VenueGalleryStepProps["data"]>) => void;
}

export function VenueGalleryStep({ data, onUpdate }: VenueGalleryStepProps) {
  const [showCoverPicker, setShowCoverPicker] = useState(false);
  const [showGalleryPicker, setShowGalleryPicker] = useState(false);

  const handleCoverSelect = (media: any) => {
    onUpdate({ coverImageId: media.id });
    setShowCoverPicker(false);
  };

  const handleGallerySelect = (media: any) => {
    // Add to gallery if not already present
    if (!data.galleryItems.includes(media.id)) {
      onUpdate({
        galleryItems: [...data.galleryItems, media.id],
      });
    }
    setShowGalleryPicker(false);
  };

  const removeGalleryItem = (mediaId: string) => {
    onUpdate({
      galleryItems: data.galleryItems.filter((id) => id !== mediaId),
    });
  };

  const setAsCover = (mediaId: string) => {
    onUpdate({ coverImageId: mediaId });
  };

  // Mock function to get media details by ID
  const getMediaById = (id: string) => {
    // In a real app, this would fetch from API
    return {
      id,
      name: `Media ${id}`,
      type: "image",
      url: `/placeholder-${id}.jpg`,
    };
  };

  const coverImage = data.coverImageId ? getMediaById(data.coverImageId) : null;
  const galleryImages = data.galleryItems.map((id) => getMediaById(id));

  return (
    <div className="space-y-6">
      {/* Cover Image Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-medium">Cover Image</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Choose a representative image that will be displayed as the main photo
          for this venue.
        </p>

        <Card>
          <CardContent className="p-6">
            {coverImage ? (
              <div className="space-y-4">
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge
                      variant="secondary"
                      className="bg-primary text-primary-foreground"
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Cover
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{coverImage.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {coverImage.type}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCoverPicker(true)}
                    >
                      Change
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onUpdate({ coverImageId: null })}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="text-sm font-medium mb-2">
                  No cover image selected
                </h4>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose an image that represents your venue
                </p>
                <Button onClick={() => setShowCoverPicker(true)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Select Cover Image
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Gallery Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium">Photo Gallery</h3>
            <p className="text-sm text-muted-foreground">
              Add multiple images to showcase your venue
            </p>
          </div>
          <Button onClick={() => setShowGalleryPicker(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Add Photos
          </Button>
        </div>

        {galleryImages.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {galleryImages.map((media) => (
              <Card key={media.id} className="group relative overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>

                    {/* Overlay with actions */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setAsCover(media.id)}
                        disabled={data.coverImageId === media.id}
                        className="h-8"
                      >
                        <Star className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => removeGalleryItem(media.id)}
                        className="h-8"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>

                    {/* Cover indicator */}
                    {data.coverImageId === media.id && (
                      <div className="absolute top-2 right-2">
                        <Badge
                          variant="secondary"
                          className="bg-primary text-primary-foreground text-xs"
                        >
                          <Star className="h-3 w-3 mr-1" />
                          Cover
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="p-3">
                    <p
                      className="text-sm font-medium truncate"
                      title={media.name}
                    >
                      {media.name}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {media.type}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="text-sm font-medium mb-2">No gallery photos</h4>
              <p className="text-sm text-muted-foreground">
                Add photos to showcase different areas of your venue
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Media Pickers */}
      <ControlledMediaPicker
        open={showCoverPicker}
        onOpenChange={setShowCoverPicker}
        onSelect={handleCoverSelect}
      >
        Cover Picker Trigger
      </ControlledMediaPicker>

      <ControlledMediaPicker
        open={showGalleryPicker}
        onOpenChange={setShowGalleryPicker}
        onSelect={handleGallerySelect}
        multiple={true}
      >
        Gallery Picker Trigger
      </ControlledMediaPicker>
    </div>
  );
}
