"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  ImageIcon,
  Building,
  Users,
  Trash2,
} from "lucide-react";
import { mediaService } from "@/lib/services/media-service";
import type { MediaItem } from "@/types/media";

interface DeleteMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: MediaItem | null;
  onConfirm: () => void;
}

interface MediaUsage {
  type: "venue_cover" | "venue_gallery" | "org_logo" | "org_general";
  venueId?: string;
  venueName?: string;
  orgId?: string;
  orgName?: string;
  context?: string;
}

export function DeleteMediaDialog({
  open,
  onOpenChange,
  media,
  onConfirm,
}: DeleteMediaDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!media) return null;

  const handleConfirm = async () => {
    if (!media) return;

    setIsDeleting(true);
    try {
      await mediaService.deleteMedia(media.id);
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete media:", error);
      // In a real app, show error toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            Delete Media
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{media.name}</strong>? This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Media Preview */}
          <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
              {media.url ? (
                <img
                  src={media.url}
                  alt={media.file_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{media.file_name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {media.category}
                </Badge>
                <span>{(media.file_size / (1024 * 1024)).toFixed(1)} MB</span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              <strong>Warning:</strong> Deleting this media cannot be undone.
              Make sure it's not being used anywhere before deleting.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete Media"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
