"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockMedia } from "@/lib/api";
import { MapPin, MoreVertical, Edit, Eye, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { venueService } from "@/lib/services/venue-service";
import type { Venue } from "@/types/venue";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VenueListProps {
  refreshTrigger?: number;
}

export function VenueList({ refreshTrigger }: VenueListProps) {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Safety check: ensure venues is always an array
  const safeVenues = Array.isArray(venues) ? venues : [];

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await venueService.getVenues();

        // Handle both successful and fallback responses
        if (response.success && response.data?.venues) {
          setVenues(response.data.venues);
        } else if (response.data?.venues) {
          // Fallback case: response has data but success=false
          setVenues(response.data.venues);
          setError(response.error || "Some venues may not be loaded");
        } else {
          // No data available
          setVenues([]);
          setError(response.error || "Failed to fetch venues");
        }
      } catch (err: any) {
        console.error("Error fetching venues:", err);
        setError(err.message || "Failed to load venues");
        setVenues([]); // Ensure venues is always an array
      } finally {
        setLoading(false);
      }
    };

    fetchVenues();
  }, [refreshTrigger]);

  const getCoverImage = (coverImageId?: string) => {
    if (!coverImageId) return null;
    return mockMedia.data.find((media) => media.id === coverImageId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-12rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading venues...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="m-4">
        <AlertDescription>{error}. Using mock data for now.</AlertDescription>
      </Alert>
    );
  }

  if (safeVenues.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-12rem)] text-center">
        <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold">No venues found</h3>
        <p className="text-muted-foreground">
          Get started by creating your first venue.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="flex flex-col gap-2 pr-4">
        {safeVenues.map((venue) => {
          const coverImage = getCoverImage(venue.coverImageId);
          return (
            <Link key={venue.id} href={`/dashboard/venues/${venue.id}`}>
              <div className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                      {coverImage ? (
                        <Image
                          src={coverImage.url}
                          alt={venue.name}
                          width={40}
                          height={40}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold leading-none">
                        {venue.name}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        {venue.city}
                      </p>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/venues/${venue.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/venues/${venue.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <Badge
                    variant={
                      venue.visibility === "public" ? "default" : "secondary"
                    }
                  >
                    {venue.visibility}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {venue.is_live ? "Live" : "Offline"}
                  </span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </ScrollArea>
  );
}
