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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { venueService } from "@/lib/services/venue-service";
import type { VenueDetail } from "@/types/venue";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function VenueDetailPage() {
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

  const getCoverImage = (coverImageId?: string) => {
    if (!coverImageId) return null;
    return mockMedia.data.find((media) => media.id === coverImageId);
  };

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

  const coverImage = getCoverImage(
    venue.gallery?.find((item) => item.is_featured)?.media_asset_id ||
      venue.gallery?.[0]?.media_asset_id
  );

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
          <Link href={`/dashboard/venues/${id}/edit`}>
            <Button>
              <Edit className="mr-2 h-4 w-4" />
              Edit Venue
            </Button>
          </Link>
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
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="mr-2 h-4 w-4" />
                    Gallery
                  </Button>
                </Link>
                <Link href={`/dashboard/venues/${id}/floor`}>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="mr-2 h-4 w-4" />
                    Floor Plans
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
