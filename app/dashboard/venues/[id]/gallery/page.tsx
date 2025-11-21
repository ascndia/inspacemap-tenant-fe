import { mockVenues } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VenueGallery } from "@/components/venues/venue-gallery";
import { ArrowLeft, Upload, Settings, Eye } from "lucide-react";
import Link from "next/link";

export default async function VenueGalleryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

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
            {venue.name} - Gallery
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
              <VenueGallery />
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
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Cover Image:</span>
                <span className="font-medium">Set</span>
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
  );
}
