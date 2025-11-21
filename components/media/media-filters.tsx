"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { ImageIcon, Video, Calendar } from "lucide-react"

export function MediaFilters() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-4">Filters</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Type</Label>
            <div className="flex flex-col gap-1">
              <Button variant="secondary" className="justify-start font-normal">
                <ImageIcon className="mr-2 h-4 w-4" />
                Images
                <Badge variant="secondary" className="ml-auto">
                  12
                </Badge>
              </Button>
              <Button variant="ghost" className="justify-start font-normal">
                <Video className="mr-2 h-4 w-4" />
                Videos
                <Badge variant="secondary" className="ml-auto">
                  3
                </Badge>
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Date</Label>
            <div className="flex flex-col gap-1">
              <Button variant="ghost" className="justify-start font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                Last 7 days
              </Button>
              <Button variant="ghost" className="justify-start font-normal">
                <Calendar className="mr-2 h-4 w-4" />
                Last 30 days
              </Button>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Tags</Label>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                #venue
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                #interior
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                #exterior
              </Badge>
              <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                #360
              </Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
