"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaGrid } from "@/components/media/media-grid";
import { MediaUpload } from "@/components/media/media-upload";
import { MediaFilters } from "@/components/media/media-filters";
import { mediaService } from "@/lib/services/media-service";
import type { MediaItem, MediaListResponse } from "@/types/media";
import { useAuthStore } from "@/lib/stores/auth-store";
import { mockMedia } from "@/lib/api";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [mediaCounts, setMediaCounts] = useState({ images: 0, videos: 0 });
  const itemsPerPage = 50;

  const { user, token } = useAuthStore();

  const getDateFilter = (dateFilter: string): string => {
    const now = new Date();
    switch (dateFilter) {
      case "7days":
        now.setDate(now.getDate() - 7);
        break;
      case "30days":
        now.setDate(now.getDate() - 30);
        break;
      case "90days":
        now.setDate(now.getDate() - 90);
        break;
      case "year":
        now.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return "";
    }
    return now.toISOString();
  };

  const getMimeTypeFilter = (typeFilter: string): string => {
    switch (typeFilter) {
      case "image":
        return "image/%";
      case "video":
        return "video/%";
      default:
        return "";
    }
  };

  // Load media on component mount and when page changes
  useEffect(() => {
    console.log("MediaLibrary: Component mounted, checking auth", {
      hasToken: !!token,
      hasUser: !!user,
    });
    const loadMedia = async () => {
      // Only load media if user is authenticated
      if (!token || !user) {
        console.log("MediaLibrary: No auth, setting error");
        setLoading(false);
        setError("Please log in to view media");
        return;
      }

      console.log("MediaLibrary: User authenticated, loading media");
      try {
        setLoading(true);
        setError(null);
        console.log(
          "MediaLibrary: Calling mediaService.getMedia() with pagination and filters",
          {
            page: currentPage,
            limit: itemsPerPage,
            mime_type:
              selectedFilters.type !== "all"
                ? getMimeTypeFilter(selectedFilters.type)
                : undefined,
            uploaded_after:
              selectedFilters.date !== "all"
                ? getDateFilter(selectedFilters.date)
                : undefined,
            search: searchQuery || undefined,
          }
        );
        const response = await mediaService.getMedia({
          page: currentPage,
          limit: itemsPerPage,
          mime_type:
            selectedFilters.type !== "all"
              ? getMimeTypeFilter(selectedFilters.type)
              : undefined,
          uploaded_after:
            selectedFilters.date !== "all"
              ? getDateFilter(selectedFilters.date)
              : undefined,
          search: searchQuery || undefined,
        });
        console.log("MediaLibrary: API call successful", response);

        if (response && response.data) {
          setMedia(response.data);
          setTotalPages(response.pagination?.total_pages || 1);
          setTotalItems(response.pagination?.total || response.data.length);

          // Calculate media counts from current data (this is approximate since we only have current page data)
          const images = response.data.filter((item) =>
            item.file_type?.startsWith("image/")
          ).length;
          const videos = response.data.filter((item) =>
            item.file_type?.startsWith("video/")
          ).length;
          setMediaCounts({ images, videos });
        } else {
          // Fallback to mock data
          setMedia(mockMedia.data);
          setTotalPages(1);
          setTotalItems(mockMedia.data.length);
          setError("Using demo data - API not available");
        }
      } catch (err: any) {
        console.error("MediaLibrary: API call failed, using mock data:", err);
        // Fall back to mock data for development
        setMedia(mockMedia.data);
        setTotalPages(1);
        setTotalItems(mockMedia.data.length);
        setError("Using demo data - API not available");
      } finally {
        setLoading(false);
      }
    };

    loadMedia();
  }, [user, token, currentPage, selectedFilters, searchQuery]);

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
    setCurrentPage(1); // Reset to first page when filters change
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
              {/* Pagination Info */}
              {!loading && !error && totalItems > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing{" "}
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}{" "}
                  to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                  {totalItems} items
                </div>
              )}

              {/* Page Navigation */}
              {totalPages > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    ‹ Prev
                  </Button>
                  <span className="text-sm text-muted-foreground px-2">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCurrentPage(Math.min(totalPages, currentPage + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    Next ›
                  </Button>
                </div>
              )}

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search media..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1); // Reset to first page when search changes
                  }}
                  className="pl-10 w-64"
                />
              </div>

              {/* Sort */}
              <Select
                value={sortBy}
                onValueChange={(value) => {
                  setSortBy(value);
                  setCurrentPage(1); // Reset to first page when sort changes
                }}
              >
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
                mediaCounts={mediaCounts}
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
                <div>
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

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6">
                      <div className="text-sm text-muted-foreground">
                        Showing{" "}
                        {Math.min(
                          (currentPage - 1) * itemsPerPage + 1,
                          totalItems
                        )}{" "}
                        to {Math.min(currentPage * itemsPerPage, totalItems)} of{" "}
                        {totalItems} items
                      </div>
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() =>
                                setCurrentPage(Math.max(1, currentPage - 1))
                              }
                              className={
                                currentPage === 1
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>

                          {/* Page numbers */}
                          {(() => {
                            const pages = [];
                            const maxPages = Math.min(5, totalPages);
                            for (let i = 0; i < maxPages; i++) {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }

                              pages.push(
                                <PaginationItem key={pageNum}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(pageNum)}
                                    isActive={currentPage === pageNum}
                                    className="cursor-pointer"
                                  >
                                    {pageNum}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            return pages;
                          })()}

                          {totalPages > 5 && currentPage < totalPages - 2 && (
                            <PaginationItem>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )}

                          <PaginationItem>
                            <PaginationNext
                              onClick={() =>
                                setCurrentPage(
                                  Math.min(totalPages, currentPage + 1)
                                )
                              }
                              className={
                                currentPage === totalPages
                                  ? "pointer-events-none opacity-50"
                                  : "cursor-pointer"
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  )}
                </div>
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
