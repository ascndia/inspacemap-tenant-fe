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
import { mockVenues, mockOrganizations } from "@/lib/api";

interface DeleteMediaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  media: {
    id: string;
    name: string;
    type: string;
    size: string;
  } | null;
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

  // Mock usage detection - in real app, this would come from API
  const getMediaUsage = (mediaId: string): MediaUsage[] => {
    const usage: MediaUsage[] = [];

    // Check venue covers
    mockVenues.forEach((venue) => {
      if (venue.coverImageId === mediaId) {
        usage.push({
          type: "venue_cover",
          venueId: venue.id,
          venueName: venue.name,
          context: "Cover image",
        });
      }
    });

    // Check venue galleries (mock - assume some venues use this media)
    if (mediaId === "1" || mediaId === "4") {
      usage.push({
        type: "venue_gallery",
        venueId: "1",
        venueName: "Grand Plaza Mall",
        context: "Gallery image",
      });
    }

    // Check organization logos
    mockOrganizations.forEach((org) => {
      if (org.logoURL?.includes(mediaId)) {
        usage.push({
          type: "org_logo",
          orgId: org.id,
          orgName: org.name,
          context: "Organization logo",
        });
      }
    });

    // Check organization general usage (mock)
    if (mediaId === "2") {
      usage.push({
        type: "org_general",
        orgId: "1",
        orgName: "Acme Corp",
        context: "General usage",
      });
    }

    return usage;
  };

  const usage = getMediaUsage(media.id);
  const hasUsage = usage.length > 0;

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      onConfirm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to delete media:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getUsageIcon = (type: MediaUsage["type"]) => {
    switch (type) {
      case "venue_cover":
      case "venue_gallery":
        return <Building className="h-4 w-4" />;
      case "org_logo":
      case "org_general":
        return <Users className="h-4 w-4" />;
      default:
        return <ImageIcon className="h-4 w-4" />;
    }
  };

  const getUsageLabel = (usage: MediaUsage) => {
    switch (usage.type) {
      case "venue_cover":
        return `Cover image for ${usage.venueName}`;
      case "venue_gallery":
        return `Gallery image in ${usage.venueName}`;
      case "org_logo":
        return `Logo for ${usage.orgName}`;
      case "org_general":
        return `Used by ${usage.orgName}`;
      default:
        return "Unknown usage";
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
            <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="font-medium">{media.name}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant="outline" className="text-xs">
                  {media.type}
                </Badge>
                <span>{media.size}</span>
              </div>
            </div>
          </div>

          {/* Usage Warning */}
          {hasUsage && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-600">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  This media is currently in use
                </span>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  Deleting this media will affect the following:
                </p>

                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {usage.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-muted/50 rounded-md"
                    >
                      {getUsageIcon(item.type)}
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {getUsageLabel(item)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.context}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                <p className="text-sm text-amber-800">
                  <strong>Warning:</strong> Deleting this media may break the
                  display of associated content. Consider replacing it first or
                  updating the affected items.
                </p>
              </div>
            </div>
          )}

          {!hasUsage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">
                This media is not currently used anywhere and can be safely
                deleted.
              </p>
            </div>
          )}
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
