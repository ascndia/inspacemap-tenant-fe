"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Save, Image as ImageIcon, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { venueService } from "@/lib/services/venue-service";
import { mediaService } from "@/lib/services/media-service";
import { useToast } from "@/hooks/use-toast";
import type { VenueDetail, UpdateVenueRequest } from "@/types/venue";
import type { Media } from "@/types/media";
import { replaceMinioPort } from "@/lib/utils";
import { PermissionGuard } from "@/components/auth/permission-guard";

export default function VenueEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { toast } = useToast();
  const router = useRouter();

  const [venue, setVenue] = useState<VenueDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coverImage, setCoverImage] = useState<Media | null>(null);
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  // Form state
  const [formData, setFormData] = useState<UpdateVenueRequest>({
    name: "",
    description: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    coordinates: { latitude: 0, longitude: 0 },
    visibility: "private",
    cover_image_id: undefined,
  });

  // Load venue data
  useEffect(() => {
    const loadVenue = async () => {
      try {
        setLoading(true);
        const response = await venueService.getVenueById(id);

        if (response.success && response.data) {
          const venueData = response.data;
          setVenue(venueData);

          // Set form data
          setFormData({
            name: venueData.name,
            description: venueData.description || "",
            address: venueData.address || "",
            city: venueData.city || "",
            province: venueData.province || "",
            postal_code: venueData.postal_code || "",
            coordinates: {
              latitude: venueData.coordinates.latitude,
              longitude: venueData.coordinates.longitude,
            },
            visibility: venueData.visibility,
            cover_image_id: venueData.cover_image_id, // Set initial cover_image_id
          });

          // Load cover image if exists
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

          // Update form data with cover image ID
          setFormData((prev) => ({
            ...prev,
            cover_image_id: coverImageId,
          }));

          // If we have cover image URL, use it directly (replace port for dev environment)
          if (coverImageUrl) {
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
          toast({
            title: "Error",
            description: response.error || "Failed to load venue details",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to load venue:", error);
        toast({
          title: "Error",
          description: "Failed to load venue details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadVenue();
  }, [id, toast]);

  const handleInputChange = (field: keyof UpdateVenueRequest, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCoordinatesChange = (
    field: "latitude" | "longitude",
    value: number
  ) => {
    setFormData((prev) => ({
      ...prev,
      coordinates: {
        ...prev.coordinates!,
        [field]: value,
      },
    }));
  };

  const handleCoverImageSelect = async (media: Media) => {
    setCoverImage(media);
    setFormData((prev) => ({ ...prev, cover_image_id: media.id }));
  };

  const handleRemoveCoverImage = () => {
    setCoverImage(null);
    setFormData((prev) => ({ ...prev, cover_image_id: null }));
  };

  const handleSave = async () => {
    if (!venue) return;

    try {
      setSaving(true);

      // Prepare update data - only include fields that have changed
      const updateData: UpdateVenueRequest = {};

      if (formData.name !== venue.name) updateData.name = formData.name;
      if (formData.description !== (venue.description || ""))
        updateData.description = formData.description;
      if (formData.address !== (venue.address || ""))
        updateData.address = formData.address;
      if (formData.city !== (venue.city || "")) updateData.city = formData.city;
      if (formData.province !== (venue.province || ""))
        updateData.province = formData.province;
      if (formData.postal_code !== (venue.postal_code || ""))
        updateData.postal_code = formData.postal_code;
      if (
        formData.coordinates?.latitude !== venue.coordinates.latitude ||
        formData.coordinates?.longitude !== venue.coordinates.longitude
      ) {
        updateData.coordinates = formData.coordinates;
      }
      if (formData.visibility !== venue.visibility)
        updateData.visibility = formData.visibility;
      if (formData.cover_image_id !== undefined)
        updateData.cover_image_id = formData.cover_image_id;

      const response = await venueService.updateVenue(id, updateData);

      if (response.success) {
        toast({
          title: "Success",
          description: "Venue updated successfully",
        });

        // Redirect to venue detail page
        router.push(`/dashboard/venues/${id}`);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to update venue",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Failed to update venue:", error);
      toast({
        title: "Error",
        description: "Failed to update venue",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <PermissionGuard
      permission="venue:update"
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            You don't have permission to edit venues
          </p>
          <Link href="/dashboard/venues">
            <Button className="mt-4">Back to Venues</Button>
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
              Edit {venue?.name || "Venue"}
            </h1>
            <p className="text-sm text-muted-foreground">
              Modify venue details and settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/dashboard/venues/${id}`}>Cancel</Link>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>

        {/* Cover Image Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Cover Image
            </CardTitle>
            <CardDescription>
              Set a cover image for your venue. This will be displayed
              prominently in venue listings and details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coverImage ? (
              <div className="space-y-4">
                <div className="relative w-full max-w-md">
                  <Image
                    src={coverImage.url}
                    alt="Cover image"
                    width={400}
                    height={200}
                    className="w-full h-32 object-cover rounded-lg border"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6"
                    onClick={handleRemoveCoverImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <MediaPicker
                    onSelect={handleCoverImageSelect}
                    selectedMediaId={formData.cover_image_id as string}
                    multiple={false}
                    acceptTypes={["image"]}
                    trigger={
                      <Button variant="outline">
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Change Image
                      </Button>
                    }
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
                <ImageIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-4">
                  No cover image selected
                </p>
                <MediaPicker
                  onSelect={handleCoverImageSelect}
                  selectedMediaId={formData.cover_image_id as string}
                  multiple={false}
                  acceptTypes={["image"]}
                  trigger={
                    <Button>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Select Cover Image
                    </Button>
                  }
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>
                Update the core details of your venue.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Venue Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ""}
                  onChange={(e) => handleInputChange("address", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter venue description..."
                  className="min-h-[100px]"
                  value={formData.description || ""}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>
                Configure venue settings and preferences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="visibility">Visibility</Label>
                <Select
                  value={formData.visibility}
                  onValueChange={(value: "public" | "private" | "unlisted") =>
                    handleInputChange("visibility", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                    <SelectItem value="unlisted">Unlisted</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ""}
                  onChange={(e) => handleInputChange("city", e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="province">Province</Label>
                <Input
                  id="province"
                  value={formData.province || ""}
                  onChange={(e) =>
                    handleInputChange("province", e.target.value)
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={formData.postal_code || ""}
                  onChange={(e) =>
                    handleInputChange("postal_code", e.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Location</CardTitle>
            <CardDescription>
              Update the geographical location of your venue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.coordinates?.latitude || ""}
                  onChange={(e) =>
                    handleCoordinatesChange(
                      "latitude",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.coordinates?.longitude || ""}
                  onChange={(e) =>
                    handleCoordinatesChange(
                      "longitude",
                      parseFloat(e.target.value) || 0
                    )
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGuard>
  );
}
