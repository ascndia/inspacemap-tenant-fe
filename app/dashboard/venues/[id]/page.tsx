import { mockVenues, mockMedia } from "@/lib/api";
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
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function VenueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  const getCoverImage = (coverImageId?: string) => {
    if (!coverImageId) return null;
    return mockMedia.find((media) => media.id === coverImageId);
  };

  const coverImage = getCoverImage(venue.coverImageId);

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
              variant={venue.status === "published" ? "default" : "secondary"}
            >
              {venue.status}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Venue details and overview
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
        <Card>
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
                <h3 className="font-medium">Address</h3>
                <p className="text-sm text-muted-foreground">{venue.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Floors</h3>
                  <p className="text-sm text-muted-foreground">
                    {venue.floors.length} floors
                  </p>
                </div>
                <div>
                  <h3 className="font-medium">Status</h3>
                  <Badge
                    variant={
                      venue.status === "published" ? "default" : "secondary"
                    }
                  >
                    {venue.status}
                  </Badge>
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
                <span>Floors:</span>
                <span className="font-medium">{venue.floors.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Status:</span>
                <Badge
                  variant={
                    venue.status === "published" ? "default" : "secondary"
                  }
                  className="text-xs"
                >
                  {venue.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
