"use client"

import { mockMedia } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Play, MoreHorizontal, Maximize2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function MediaGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {mockMedia.map((item) => (
        <Dialog key={item.id}>
          <div className="group relative rounded-lg border bg-card overflow-hidden hover:shadow-md transition-all">
            <div className="aspect-square bg-muted relative">
              {/* Placeholder for actual image */}
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-muted">
                {item.type === "video" ? <Play className="h-8 w-8" /> : <Maximize2 className="h-8 w-8" />}
              </div>

              {/* Overlay Actions */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary">
                    Preview
                  </Button>
                </DialogTrigger>
              </div>

              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="secondary" className="h-6 w-6">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>Rename</DropdownMenuItem>
                    <DropdownMenuItem>Download</DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-sm truncate" title={item.name}>
                  {item.name}
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{item.size}</span>
                <Badge variant="outline" className="text-[10px] h-4 px-1">
                  {item.type}
                </Badge>
              </div>
            </div>
          </div>

          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{item.name}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4">
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                {/* Preview Placeholder */}
                <p className="text-muted-foreground">Preview not available</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">{item.type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Size</p>
                  <p className="font-medium">{item.size}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Uploaded</p>
                  <p className="font-medium">2 days ago</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Dimensions</p>
                  <p className="font-medium">1920x1080</p>
                </div>
              </div>
              <div>
                <p className="text-muted-foreground text-sm mb-2">Tags</p>
                <div className="flex gap-2">
                  <Badge variant="secondary">#venue</Badge>
                  <Badge variant="secondary">#interior</Badge>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  )
}
