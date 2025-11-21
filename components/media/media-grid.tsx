"use client";

import { useMemo, useState } from "react";
import { mockMedia } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Play,
  MoreHorizontal,
  Maximize2,
  Download,
  Trash2,
  Edit,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { DeleteMediaDialog } from "./delete-media-dialog";

interface MediaGridProps {
  searchQuery?: string;
  filters?: {
    type: string;
    date: string;
    tags: string[];
  };
  sortBy?: string;
  viewMode?: "grid" | "list";
  mode?: "manage" | "select";
  onSelect?: (media: any) => void;
  media?: MediaItem[];
}

export function MediaGrid({
  searchQuery = "",
  filters = { type: "all", date: "all", tags: [] },
  sortBy = "newest",
  viewMode = "grid",
  mode = "manage",
  onSelect,
  media = mockMedia,
}: MediaGridProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaItem | null>(null);

  const handleDeleteClick = (mediaItem: MediaItem) => {
    setMediaToDelete(mediaItem);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (mediaToDelete) {
      // In real app, this would call an API to delete the media
      console.log("Deleting media:", mediaToDelete.id);
      // For now, just close the dialog
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    }
  };

  // Filter and sort media
  const filteredAndSortedMedia = useMemo(() => {
    let filtered = media.filter((item) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Type filter
      if (filters.type !== "all" && item.type !== filters.type) {
        return false;
      }

      // Date filter (simplified - in real app would check actual dates)
      if (filters.date !== "all") {
        // Mock date filtering logic
        const itemIndex = media.indexOf(item);
        const daysOld = itemIndex * 10; // Mock age calculation
        switch (filters.date) {
          case "7days":
            if (daysOld > 7) return false;
            break;
          case "30days":
            if (daysOld > 30) return false;
            break;
          case "90days":
            if (daysOld > 90) return false;
            break;
          case "year":
            if (daysOld > 365) return false;
            break;
        }
      }

      // Tags filter (simplified - in real app would check actual tags)
      if (filters.tags.length > 0) {
        // Mock tag filtering - assume some items have certain tags
        const mockTags =
          item.id === "1"
            ? ["#venue", "#interior"]
            : item.id === "2"
            ? ["#interior"]
            : item.id === "3"
            ? ["#360", "#panorama"]
            : ["#exterior"];
        const hasMatchingTag = filters.tags.some((tag) =>
          mockTags.includes(tag)
        );
        if (!hasMatchingTag) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return media.indexOf(a) - media.indexOf(b);
        case "name":
          return a.name.localeCompare(b.name);
        case "size":
          // Simple size comparison (parse MB)
          const aSize = parseFloat(a.size);
          const bSize = parseFloat(b.size);
          return bSize - aSize;
        case "newest":
        default:
          return media.indexOf(b) - media.indexOf(a);
      }
    });

    return filtered;
  }, [searchQuery, filters, sortBy, media]);

  return (
    <>
      {viewMode === "list" ? (
        <div className="space-y-2">
          {filteredAndSortedMedia.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Maximize2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No media found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAndSortedMedia.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                {mode === "select" && <Checkbox className="shrink-0" />}

                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center shrink-0">
                  {item.type === "video" ? (
                    <Play className="h-6 w-6" />
                  ) : (
                    <Maximize2 className="h-6 w-6" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.name}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{item.size}</span>
                    <span>•</span>
                    <span>{item.type}</span>
                    <span>•</span>
                    <span>2 days ago</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {item.type}
                  </Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Maximize2 className="mr-2 h-4 w-4" />
                        Preview
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div
          className={cn(
            "grid gap-4",
            viewMode === "grid" &&
              "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"
          )}
        >
          {filteredAndSortedMedia.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              <Maximize2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium">No media found</h3>
              <p className="text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAndSortedMedia.map((item) => (
              <MediaItem
                key={item.id}
                item={item}
                mode={mode}
                onSelect={onSelect}
                onDeleteClick={handleDeleteClick}
              />
            ))
          )}
        </div>
      )}

      <DeleteMediaDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        media={mediaToDelete}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

interface MediaItemProps {
  item: MediaItem;
  mode: "manage" | "select";
  onSelect?: (media: any) => void;
  onDeleteClick: (media: MediaItem) => void;
}

function MediaItem({ item, mode, onSelect, onDeleteClick }: MediaItemProps) {
  return (
    <Dialog>
      <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all">
        <div className="aspect-square bg-muted relative">
          {/* Placeholder for actual image */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
            {item.type === "video" ? (
              <Play className="h-8 w-8" />
            ) : (
              <Maximize2 className="h-8 w-8" />
            )}
          </div>

          {/* Selection overlay for select mode */}
          {mode === "select" && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Button
                size="sm"
                onClick={() => onSelect?.(item)}
                className="bg-primary hover:bg-primary/90"
              >
                Select
              </Button>
            </div>
          )}

          {/* Actions overlay for manage mode */}
          {mode === "manage" && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <DialogTrigger asChild>
                <Button size="sm" variant="secondary">
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
            </div>
          )}

          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="icon" variant="secondary" className="h-6 w-6">
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Maximize2 className="mr-2 h-4 w-4" />
                  Preview
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={() => onDeleteClick(item)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-sm truncate" title={item.name}>
              {item.name}
            </p>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{item.size}</span>
            <Badge variant="outline" className="text-[10px] h-4 px-1">
              {item.type}
            </Badge>
          </div>
        </div>
      </div>

      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            {/* Preview Placeholder */}
            <p className="text-muted-foreground">Preview not available</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Type</p>
              <p className="font-medium capitalize">{item.type}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Size</p>
              <p className="font-medium">{item.size}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Uploaded</p>
              <p className="font-medium">2 days ago</p>
            </div>
            <div>
              <p className="text-muted-foreground">Dimensions</p>
              <p className="font-medium">1920x1080</p>
            </div>
          </div>
          <div>
            <p className="text-muted-foreground text-sm mb-2">Tags</p>
            <div className="flex gap-2">
              <Badge variant="secondary">#venue</Badge>
              <Badge variant="secondary">#interior</Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
