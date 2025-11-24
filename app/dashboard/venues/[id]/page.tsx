"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { mockMedia } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Users,
  Image as ImageIcon,
  Edit,
  GitBranch,
  Loader2,
  GalleryVertical,
  Map,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { venueService } from "@/lib/services/venue-service";
import { mediaService } from "@/lib/services/media-service";
import type { VenueDetail } from "@/types/venue";
import type { Media } from "@/types/media";
import { replaceMinioPort } from "@/lib/utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAccessControl } from "@/lib/hooks/use-access-control";

export default function VenueDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { canAccess } = useAccessControl();

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [coverImage, setCoverImage] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenueDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await venueService.getVenueById(id);

        if (response.success && response.data) {
          setVenue(response.data);

          // Load cover image if exists
          const venueData = response.data;
          let coverImageId = venueData.cover_image_id;
          let coverImageUrl = venueData.cover_image_url;

          // If no direct cover_image_id, check gallery for featured image
          if (
            !coverImageId &&
            venueData.gallery &&
            venueData.gallery.length > 0
          ) {
            const coverItem = venueData.gallery.find(
              (item) => item.is_featured
            );
            if (coverItem) {
              coverImageId = coverItem.media_asset_id;
            }
          }

          // Load cover image
          if (coverImageUrl) {
            // Create basic media object from URL with port replacement
            const processedUrl = replaceMinioPort(coverImageUrl);
            const basicMedia: Media = {
              id: coverImageId || "cover-image",
              name: "Cover Image",
              url: processedUrl,
              file_type: "image/jpeg",
              file_size: 0,
              created_at: venueData.created_at,
              updated_at: venueData.updated_at,
            };
            setCoverImage(basicMedia);
          } else if (coverImageId) {
            // Fetch from media service
            try {
              const mediaResponse = await mediaService.getMediaById(
                coverImageId
              );
              if (mediaResponse.success && mediaResponse.data) {
                setCoverImage(mediaResponse.data);
              }
            } catch (error) {
              console.warn("Failed to load cover image:", error);
            }
          }
        } else {
          throw new Error(response.error || "Failed to fetch venue details");
        }
      } catch (err: any) {
        console.error("Error fetching venue details:", err);
        setError(err.message || "Failed to load venue details");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVenueDetail();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading venue details...</span>
      </div>
    );
  }

  if (error || !venue) {
    return (
      <Alert className="m-4">
        <AlertDescription>{error || "Venue not found"}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/venues">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold md:text-2xl">{venue.name}</h1>
            <Badge
              variant={venue.visibility === "public" ? "default" : "secondary"}
            >
              {venue.visibility}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            {venue.description || "Venue details and overview"}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/venues/${id}/revision`}>
            <Button variant="outline">
              <GitBranch className="mr-2 h-4 w-4" />
              See Revisions
            </Button>
          </Link>
          {canAccess("venue:update") && (
            <Link href={`/dashboard/venues/${id}/edit`}>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit Venue
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Cover Image Section */}
      {coverImage && (
        <Card className="py-0">
          <CardContent className="p-0">
            <div className="relative h-64 w-full overflow-hidden rounded-lg">
              <Image
                src={coverImage.url}
                alt={venue.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/20 to-transparent" />
              <div className="absolute bottom-4 left-4">
                <Badge variant="secondary" className="bg-white/90 text-black">
                  <ImageIcon className="mr-1 h-3 w-3" />
                  Cover Image
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Info */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location & Basic Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Full Address</h3>
                <p className="text-sm text-muted-foreground">
                  {venue.full_address || "No address provided"}
                </p>
              </div>
              {(venue.city || venue.province || venue.postal_code) && (
                <div className="grid grid-cols-3 gap-4">
                  {venue.city && (
                    <div>
                      <h3 className="font-medium">City</h3>
                      <p className="text-sm text-muted-foreground">
                        {venue.city}
                      </p>
                    </div>
                  )}
                  {venue.province && (
                    <div>
                      <h3 className="font-medium">Province</h3>
                      <p className="text-sm text-muted-foreground">
                        {venue.province}
                      </p>
                    </div>
                  )}
                  {venue.postal_code && (
                    <div>
                      <h3 className="font-medium">Postal Code</h3>
                      <p className="text-sm text-muted-foreground">
                        {venue.postal_code}
                      </p>
                    </div>
                  )}
                </div>
              )}
              {venue.description && (
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    {venue.description}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Coordinates</h3>
                  <p className="text-sm text-muted-foreground">
                    {venue.coordinates.latitude.toFixed(6)},{" "}
                    {venue.coordinates.longitude.toFixed(6)}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Visibility</h3>
                  <Badge
                    variant={
                      venue.visibility === "public" ? "default" : "secondary"
                    }
                  >
                    {venue.visibility}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Created</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(venue.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(venue.updated_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gallery Preview */}
          {venue.gallery && venue.gallery.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Gallery Preview
                </CardTitle>
                <CardDescription>
                  Recent images from this venue's gallery
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {venue.gallery.slice(0, 4).map((item, index) => (
                    <div key={item.id || index} className="relative group">
                      <div className="aspect-square relative overflow-hidden rounded-lg border">
                        <Image
                          src={replaceMinioPort(
                            item.media_url || item.url || "/placeholder.svg"
                          )}
                          alt={`Gallery item ${index + 1}`}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        {item.is_featured && (
                          <Badge className="absolute top-2 right-2 text-xs">
                            Featured
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {venue.gallery.length > 4 && (
                  <div className="mt-4 text-center">
                    <Link href={`/dashboard/venues/${id}/gallery`}>
                      <Button variant="outline">
                        View All {venue.gallery.length} Images
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Navigate to different sections of this venue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Link href={`/dashboard/venues/${id}/gallery`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                  >
                    <GalleryVertical className="mr-2 h-4 w-4" />
                    Gallery
                  </Button>
                </Link>
                <Link href={`/dashboard/venues/${id}/floor`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                  >
                    <Map className="mr-2 h-4 w-4" />
                    Floor Plans
                  </Button>
                </Link>
                <Link href={`/dashboard/venues/${id}/revision`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start cursor-pointer"
                  >
                    <GitBranch className="mr-2 h-4 w-4" />
                    Revisions
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">
                No recent activity
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Gallery Items:</span>
                <span className="font-medium">
                  {venue.gallery?.length || 0}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>POIs:</span>
                <span className="font-medium">{venue.pois?.length || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cover Image:</span>
                <span className="font-medium">{coverImage ? "Yes" : "No"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Visibility:</span>
                <Badge
                  variant={
                    venue.visibility === "public" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {venue.visibility}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span>Created:</span>
                <span className="font-medium text-xs">
                  {new Date(venue.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Last Updated:</span>
                <span className="font-medium text-xs">
                  {new Date(venue.updated_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
