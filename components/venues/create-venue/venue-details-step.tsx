"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { MapPin, Minus, Plus } from "lucide-react";

interface VenueDetailsStepProps {
  data: {
    name: string;
    slug: string;
    description: string;
    address: string;
    city: string;
    province: string;
    postalCode: string;
    latitude: number | null;
    longitude: number | null;
    floorCount: number;
  };
  onUpdate: (updates: Partial<VenueDetailsStepProps["data"]>) => void;
}

export function VenueDetailsStep({ data, onUpdate }: VenueDetailsStepProps) {
  const handleLocationSearch = () => {
    // In a real app, this would open a map picker or geolocation service
    // For now, we'll set mock coordinates
    onUpdate({
      latitude: -6.2088,
      longitude: 106.8456,
    });
  };

  const updateFloorCount = (delta: number) => {
    const newCount = Math.max(1, data.floorCount + delta);
    onUpdate({ floorCount: newCount });
  };

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">Venue Name *</Label>
            <Input
              id="name"
              value={data.name}
              onChange={(e) => onUpdate({ name: e.target.value })}
              placeholder="e.g. Grand Plaza Mall"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug *</Label>
            <Input
              id="slug"
              value={data.slug}
              onChange={(e) => onUpdate({ slug: e.target.value })}
              placeholder="grand-plaza-mall"
              required
            />
            <p className="text-xs text-muted-foreground">
              Used in URLs and must be unique
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={data.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="Describe the venue..."
            rows={3}
          />
        </div>
      </div>

      {/* Location Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Location</h3>
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              value={data.address}
              onChange={(e) => onUpdate({ address: e.target.value })}
              placeholder="123 Main Street"
              className="flex-1"
              required
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleLocationSearch}
              className="shrink-0"
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={data.city}
              onChange={(e) => onUpdate({ city: e.target.value })}
              placeholder="Jakarta"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="province">Province</Label>
            <Input
              id="province"
              value={data.province}
              onChange={(e) => onUpdate({ province: e.target.value })}
              placeholder="DKI Jakarta"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="postalCode">Postal Code</Label>
            <Input
              id="postalCode"
              value={data.postalCode}
              onChange={(e) => onUpdate({ postalCode: e.target.value })}
              placeholder="12345"
            />
          </div>
        </div>

        {data.latitude && data.longitude && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Latitude</Label>
              <Input
                value={data.latitude?.toFixed(6) || ""}
                readOnly
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label>Longitude</Label>
              <Input
                value={data.longitude?.toFixed(6) || ""}
                readOnly
                className="bg-muted"
              />
            </div>
          </div>
        )}
      </div>

      {/* Floor Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Floor Information</h3>
        <div className="space-y-2">
          <Label>Number of Floors</Label>
          <div className="flex items-center gap-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateFloorCount(-1)}
              disabled={data.floorCount <= 1}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="text-lg font-medium min-w-[3rem] text-center">
              {data.floorCount}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => updateFloorCount(1)}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Total number of floors in this venue. Individual floor details will
            be configured after creation.
          </p>
        </div>
      </div>
    </div>
  );
}
