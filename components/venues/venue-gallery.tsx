"use client";

import { mockMedia } from "@/lib/api";
import { MediaPicker } from "@/components/media/media-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Maximize2 } from "lucide-react";

export function VenueGallery() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Gallery Images</h3>
        <MediaPicker
          onSelect={(media) => console.log("Selected:", media)}
          trigger={<Button>Add Images</Button>}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {mockMedia.data.slice(0, 4).map((item) => (
          <Card key={item.id} className="overflow-hidden group relative">
            <div className="aspect-square bg-muted relative">
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <Maximize2 className="h-8 w-8" />
              </div>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <Button variant="destructive" size="icon" className="h-8 w-8">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <CardContent className="p-2">
              <p className="text-xs font-medium truncate">{item.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
