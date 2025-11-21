"use client"

import { MapPin } from "lucide-react"

export function VenueMap() {
  return (
    <div className="relative h-full w-full bg-muted/20 rounded-lg border flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-[url('https://raw.githubusercontent.com/leaflet-extras/leaflet-providers/master/preview/CartoDB.Positron.png')] bg-cover bg-center opacity-50" />
      <div className="relative z-10 flex flex-col items-center gap-2 p-4 bg-background/80 backdrop-blur-sm rounded-lg border shadow-sm">
        <MapPin className="h-8 w-8 text-primary animate-bounce" />
        <div className="text-center">
          <p className="font-medium">Interactive Map View</p>
          <p className="text-xs text-muted-foreground">Leaflet integration placeholder</p>
        </div>
      </div>
    </div>
  )
}
