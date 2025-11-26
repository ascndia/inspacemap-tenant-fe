"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VenueGallery } from "@/components/venues/venue-gallery";
import { ArrowLeft, Upload, Settings, Eye, Loader2 } from "lucide-react";
import Link from "next/link";
import { venueService } from "@/lib/services/venue-service";
import type { VenueDetail } from "@/types/venue";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { replaceMinioPort } from "@/lib/utils";

export default function VenueGalleryPage() {
  const params = useParams();
  const id = params.id as string;

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVenueDetail = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await venueService.getVenueById(id);

        if (response.success && response.data) {
          console.log("Fetched venue data:", response.data);
          if (response.data.gallery) {
            response.data.gallery.map((item: any) => {
              item.url = replaceMinioPort(item.url);
            });
          }
          setVenue(response.data);
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

  const handleGalleryUpdate = () => {
    // Refresh venue data after gallery changes
    if (id) {
      venueService.getVenueById(id).then((response) => {
        if (response.success && response.data) {
          if (response.data.gallery) {
            response.data.gallery.map((item: any) => {
              item.url = replaceMinioPort(item.url);
            });
          }
          setVenue(response.data);
        }
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading gallery...</span>
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
    <PermissionGuard
      permission="venue:update"
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            You don't have permission to manage venue galleries
          </p>
          <Link href={`/dashboard/venues/${id}`}>
            <Button className="mt-4">Back to Venue</Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/venues/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold md:text-2xl">
              {venue?.name || "Venue"} - Gallery
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage images and videos for this venue
            </p>
          </div>
          <div className="flex gap-2">
            <Link href={`/dashboard/venues/${id}/gallery/edit`}>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Edit Gallery
              </Button>
            </Link>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Media
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          {/* Gallery Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Images</CardTitle>
                <CardDescription>
                  Images are displayed in the order they appear below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <VenueGallery
                  venueId={id}
                  galleryItems={venue?.gallery || []}
                  onUpdate={handleGalleryUpdate}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Gallery Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm">
                  <span>Total Images:</span>
                  <span className="font-medium">
                    {venue?.gallery?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Cover Image:</span>
                  <span className="font-medium">
                    {venue?.gallery?.some((item) => item.is_featured)
                      ? "Set"
                      : "Not Set"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sort Order:</span>
                  <span className="font-medium">Manual</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Display Mode:</span>
                  <span className="font-medium">Grid</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link href={`/dashboard/venues/${id}/gallery/edit`}>
                  <Button variant="outline" className="w-full justify-start">
                    <Settings className="mr-2 h-4 w-4" />
                    Edit & Sort Images
                  </Button>
                </Link>
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Gallery
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PermissionGuard>
  );
}
