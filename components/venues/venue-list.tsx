"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { mockVenues } from "@/lib/api"
import { MapPin, MoreVertical, Edit, Eye } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function VenueList() {
  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="flex flex-col gap-2 pr-4">
        {mockVenues.map((venue) => (
          <div key={venue.id} className="flex flex-col gap-2 rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center overflow-hidden">
                  {/* Placeholder for venue thumbnail */}
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold leading-none">{venue.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{venue.address}</p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                    <span className="sr-only">Menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="flex items-center justify-between mt-2">
              <Badge variant={venue.status === "published" ? "default" : "secondary"}>{venue.status}</Badge>
              <span className="text-xs text-muted-foreground">{venue.floors.length} Floors</span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}
