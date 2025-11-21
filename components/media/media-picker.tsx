"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mockMedia } from "@/lib/api";
import {
  Search,
  ImageIcon,
  Video,
  Upload,
  X,
  Check,
  Grid3X3,
  List,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaPickerProps {
  onSelect: (media: any) => void;
  selectedMediaId?: string;
  trigger?: React.ReactNode;
  multiple?: boolean;
  acceptTypes?: string[];
}

interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: string;
  url: string;
  thumbnail?: string;
  tags?: string[];
  uploadedAt?: string;
}

export function MediaPicker({
  onSelect,
  selectedMediaId,
  trigger,
  multiple = false,
  acceptTypes = ["image", "video"],
}: MediaPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filter media based on search and type
  const filteredMedia = useMemo(() => {
    return mockMedia.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || item.type === selectedType;
      const matchesAcceptTypes = acceptTypes.includes(item.type);

      return matchesSearch && matchesType && matchesAcceptTypes;
    });
  }, [searchQuery, selectedType, acceptTypes]);

  const handleSelect = (media: MediaItem) => {
    if (multiple) {
      const newSelected = new Set(selectedItems);
      if (newSelected.has(media.id)) {
        newSelected.delete(media.id);
      } else {
        newSelected.add(media.id);
      }
      setSelectedItems(newSelected);
    } else {
      onSelect(media);
      setOpen(false);
    }
  };

  const handleConfirmSelection = () => {
    if (multiple) {
      const selectedMedia = mockMedia.filter((item) =>
        selectedItems.has(item.id)
      );
      onSelect(selectedMedia);
    }
    setOpen(false);
    setSelectedItems(new Set());
  };

  const handleCancel = () => {
    setOpen(false);
    setSelectedItems(new Set());
    setSearchQuery("");
    setSelectedType("all");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            <ImageIcon className="mr-2 h-4 w-4" />
            {selectedMediaId ? "Change Media" : "Select Media"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-6xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle className="flex items-center justify-between">
            <span>Select Media</span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  setViewMode(viewMode === "grid" ? "list" : "grid")
                }
              >
                {viewMode === "grid" ? (
                  <List className="h-4 w-4" />
                ) : (
                  <Grid3X3 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Search and Filters */}
          <div className="px-6 py-4 border-b bg-muted/20">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={selectedType === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedType("all")}
                >
                  All
                </Button>
                {acceptTypes.includes("image") && (
                  <Button
                    variant={selectedType === "image" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType("image")}
                  >
                    <ImageIcon className="mr-1 h-3 w-3" />
                    Images
                  </Button>
                )}
                {acceptTypes.includes("video") && (
                  <Button
                    variant={selectedType === "video" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedType("video")}
                  >
                    <Video className="mr-1 h-3 w-3" />
                    Videos
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Media Content */}
          <Tabs defaultValue="library" className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="library">Media Library</TabsTrigger>
              <TabsTrigger value="upload">Upload New</TabsTrigger>
            </TabsList>

            <TabsContent value="library" className="flex-1 mt-0 px-6 pb-6">
              <ScrollArea className="h-full">
                {filteredMedia.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium text-muted-foreground">
                      No media found
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {searchQuery
                        ? "Try adjusting your search terms"
                        : "Upload some media to get started"}
                    </p>
                  </div>
                ) : (
                  <div
                    className={cn(
                      "py-4",
                      viewMode === "grid"
                        ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
                        : "space-y-2"
                    )}
                  >
                    {filteredMedia.map((item) => (
                      <MediaItemCard
                        key={item.id}
                        item={item}
                        isSelected={
                          multiple
                            ? selectedItems.has(item.id)
                            : selectedMediaId === item.id
                        }
                        onSelect={() => handleSelect(item)}
                        viewMode={viewMode}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="upload" className="flex-1 mt-0 px-6 pb-6">
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Upload Media</h3>
                <p className="text-sm text-muted-foreground mt-2 mb-4">
                  Drag and drop files here or click to browse
                </p>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Files
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <div className="text-sm text-muted-foreground">
            {multiple ? `${selectedItems.size} selected` : null}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {multiple ? (
              <Button
                onClick={handleConfirmSelection}
                disabled={selectedItems.size === 0}
              >
                Select ({selectedItems.size})
              </Button>
            ) : (
              <Button onClick={() => setOpen(false)}>Done</Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface MediaItemCardProps {
  item: MediaItem;
  isSelected: boolean;
  onSelect: () => void;
  viewMode: "grid" | "list";
}

function MediaItemCard({
  item,
  isSelected,
  onSelect,
  viewMode,
}: MediaItemCardProps) {
  if (viewMode === "list") {
    return (
      <div
        className={cn(
          "flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
          isSelected && "ring-2 ring-primary bg-primary/5"
        )}
        onClick={onSelect}
      >
        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center shrink-0">
          {item.type === "video" ? (
            <Video className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{item.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{item.size}</span>
            <Badge variant="outline" className="text-xs">
              {item.type}
            </Badge>
          </div>
        </div>
        {isSelected && (
          <div className="w-5 h-5 bg-primary rounded-full flex items-center justify-center shrink-0">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card overflow-hidden cursor-pointer transition-all hover:shadow-md",
        isSelected && "ring-2 ring-primary"
      )}
      onClick={onSelect}
    >
      <div className="aspect-square bg-muted relative">
        {/* Media Preview */}
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          {item.type === "video" ? (
            <Video className="h-8 w-8" />
          ) : (
            <ImageIcon className="h-8 w-8" />
          )}
        </div>

        {/* Selection Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-primary/20 flex items-center justify-center transition-opacity",
            isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          {isSelected && (
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <Check className="h-4 w-4 text-primary-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="p-3">
        <p className="font-medium text-sm truncate mb-1" title={item.name}>
          {item.name}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{item.size}</span>
          <Badge variant="outline" className="text-[10px] h-4 px-1">
            {item.type}
          </Badge>
        </div>
      </div>
    </div>
  );
}
