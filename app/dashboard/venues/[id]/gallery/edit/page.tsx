import { mockVenues } from "@/lib/api";
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
import { ArrowLeft, Save, Upload } from "lucide-react";
import Link from "next/link";
import { GalleryImageItem } from "@/components/venues/gallery-image-item";

export default async function VenueGalleryEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  // Mock gallery images data
  const galleryImages = [
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
  ];

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
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
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
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Add Images
                </Button>
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
                <Select defaultValue="manual">
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
                <Select defaultValue="grid">
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
                    Main Hall
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
                <span className="font-medium">9.9 MB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated:</span>
                <span className="font-medium">Today</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
