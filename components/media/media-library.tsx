"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaUpload } from "@/components/media/media-upload";
import { MediaFilters } from "@/components/media/media-filters";
import { mediaService } from "@/lib/services/media-service";
import type { MediaItem } from "@/types/media";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DialogFooter } from "@/components/ui/dialog";
import { Search, Upload, Grid, List, Filter } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface MediaLibraryProps {
  mode?: "manage" | "select";
  onSelect?: (media: any) => void;
}

export function MediaLibrary({ mode = "manage", onSelect }: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState("library");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedFilters, setSelectedFilters] = useState({
    type: "all",
    date: "all",
    tags: [] as string[],
  });
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load media on component mount
  useEffect(() => {
    const loadMedia = async () => {
      try {
        setLoading(true);
        const response = await mediaService.getMedia();
        setMedia(response.data);
      } catch (err: any) {
        setError(err.message || "Failed to load media");
        console.error("Failed to load media:", err);
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, []);

  const handleUploadSuccess = (uploadedItems: MediaItem[]) => {
    setMedia((prev) => [...uploadedItems, ...prev]);
  };

  const handleDeleteSuccess = (deletedMediaId: string) => {
    setMedia((prev) => prev.filter((item) => item.id !== deletedMediaId));
  };

  const handleFilterChange = (filterType: string, value: string | string[]) => {
    setSelectedFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  return (
    <div className="flex flex-col h-full">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        {/* Header with Search and Controls */}
        <div className="flex items-center justify-between p-4 border-b">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>

          {activeTab === "library" && (
            <div className="flex items-center gap-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                  <SelectItem value="size">Size</SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode */}
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        <TabsContent value="library" className="flex-1 mt-0">
          <div className="flex h-full">
            {/* Filters Sidebar */}
            <div className="w-64 border-r p-4 bg-muted/20">
              <div className="flex items-center gap-2 mb-4">
                <Filter className="h-4 w-4" />
                <h3 className="font-medium">Filters</h3>
              </div>
              <MediaFilters
                selectedFilters={selectedFilters}
                onFilterChange={handleFilterChange}
              />

              {/* Active Filters */}
              {(selectedFilters.type !== "all" ||
                selectedFilters.date !== "all" ||
                selectedFilters.tags.length > 0) && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Active Filters</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setSelectedFilters({
                          type: "all",
                          date: "all",
                          tags: [],
                        })
                      }
                      className="h-6 px-2 text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedFilters.type !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Type: {selectedFilters.type}
                      </Badge>
                    )}
                    {selectedFilters.date !== "all" && (
                      <Badge variant="secondary" className="text-xs">
                        Date: {selectedFilters.date}
                      </Badge>
                    )}
                    {selectedFilters.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Media Grid/List */}
            <div className="flex-1 p-4">
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading media...</p>
                  </div>
                </div>
              ) : error ? (
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <p className="text-destructive mb-2">
                      Failed to load media
                    </p>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="mt-4"
                    >
                      Retry
                    </Button>
                  </div>
                </div>
              ) : (
                <MediaGrid
                  searchQuery={searchQuery}
                  filters={selectedFilters}
                  sortBy={sortBy}
                  viewMode={viewMode}
                  mode={mode}
                  onSelect={onSelect}
                  media={media}
                  onDeleteSuccess={handleDeleteSuccess}
                />
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-0 p-4">
          <div className="max-w-2xl mx-auto">
            <MediaUpload
              onUploadSuccess={(uploadedItems) => {
                setMedia((prev) => [...uploadedItems, ...prev]);
                setActiveTab("library");
              }}
            />
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setActiveTab("library")}>
                Back to Library
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {mode === "select" && (
        <DialogFooter className="border-t p-4">
          <Button variant="outline">Cancel</Button>
          <Button onClick={() => onSelect?.(null)}>Select</Button>
        </DialogFooter>
      )}
    </div>
  );
}
