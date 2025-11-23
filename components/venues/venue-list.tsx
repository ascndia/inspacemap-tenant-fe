"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { replaceMinioPort } from "@/lib/utils";

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
      <div className="flex flex-col gap-4 pr-4">
        {safeVenues.map((venue) => (
          <Link key={venue.id} href={`/dashboard/venues/${venue.id}`}>
            <div className="group relative rounded-xl border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
              {/* Cover Image */}
              <div className="relative h-32 bg-linear-to-br from-primary/10 to-primary/5">
                {venue.cover_image_url ? (
                  <Image
                    src={replaceMinioPort(venue.cover_image_url)}
                    alt={venue.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                )}

                {/* Overlay gradient */}
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />

                {/* Status badges */}
                <div className="absolute top-3 left-3 flex gap-2">
                  <Badge
                    variant={
                      venue.visibility === "public" ? "default" : "secondary"
                    }
                    className="text-xs font-medium"
                  >
                    {venue.visibility}
                  </Badge>
                  {venue.is_live && (
                    <Badge
                      variant="default"
                      className="text-xs font-medium bg-green-600 hover:bg-green-700"
                    >
                      Live
                    </Badge>
                  )}
                </div>

                {/* Menu button */}
                <div className="absolute top-3 right-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      asChild
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-8 w-8 bg-white/90 hover:bg-white shadow-sm"
                      >
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
              </div>

              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg leading-tight mb-1 truncate">
                      {venue.name}
                    </h3>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      <span className="truncate">{venue.city}</span>
                    </div>
                  </div>
                </div>

                {/* Additional info */}
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Updated recently</span>
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    Active
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </ScrollArea>
  );
}
