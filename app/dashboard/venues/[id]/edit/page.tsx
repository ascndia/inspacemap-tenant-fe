"use client";

import { mockVenues, mockMedia } from "@/lib/api";
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
import { ArrowLeft, Save, Image as ImageIcon, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { MediaPicker } from "@/components/media/media-picker";
import Image from "next/image";

import { use } from "react";

export default function VenueEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  const [coverImageId, setCoverImageId] = useState<string | undefined>(
    venue.coverImageId
  );
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);

  const getCoverImage = (imageId?: string) => {
    if (!imageId) return null;
    return mockMedia.find((media) => media.id === imageId);
  };

  const coverImage = getCoverImage(coverImageId);

  const handleCoverImageSelect = (selectedIds: string[]) => {
    setCoverImageId(selectedIds[0] || undefined);
    setIsMediaPickerOpen(false);
  };

  const handleRemoveCoverImage = () => {
    setCoverImageId(undefined);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/venues/${id}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">
            Edit {venue.name}
          </h1>
          <p className="text-sm text-muted-foreground">
            Modify venue details and settings
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Cancel</Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Changes
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
            Set a cover image for your venue. This will be displayed prominently
            in venue listings and details.
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
                  onSelect={(media) => handleCoverImageSelect([media.id])}
                  selectedMediaId={coverImageId}
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
                onSelect={(media) => handleCoverImageSelect([media.id])}
                selectedMediaId={coverImageId}
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
              <Input id="name" defaultValue={venue.name} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" defaultValue={venue.address} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter venue description..."
                className="min-h-[100px]"
                defaultValue=""
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
              <Label htmlFor="status">Status</Label>
              <Select defaultValue={venue.status}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="category">Category</Label>
              <Select defaultValue="other">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopping">Shopping Mall</SelectItem>
                  <SelectItem value="office">Office Building</SelectItem>
                  <SelectItem value="hospital">Hospital</SelectItem>
                  <SelectItem value="airport">Airport</SelectItem>
                  <SelectItem value="hotel">Hotel</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
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
                defaultValue={venue.location?.lat || ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                defaultValue={venue.location?.lng || ""}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
