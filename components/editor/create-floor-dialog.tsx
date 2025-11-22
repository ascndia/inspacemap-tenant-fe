"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MediaPicker } from "@/components/media/media-picker";
import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { toast } from "sonner";

interface CreateFloorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  venueId: string;
  onFloorCreated: () => void;
}

export function CreateFloorDialog({
  open,
  onOpenChange,
  venueId,
  onFloorCreated,
}: CreateFloorDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    level_index: 0,
    map_image_id: "",
    pixels_per_meter: 50,
    map_width: 1920,
    map_height: 1080,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Floor name is required");
      return;
    }

    setLoading(true);
    try {
      await GraphRevisionService.createFloor(venueId, {
        name: formData.name,
        level_index: formData.level_index,
        map_image_id: formData.map_image_id || undefined,
        pixels_per_meter: formData.pixels_per_meter,
        map_width: formData.map_width,
        map_height: formData.map_height,
      });

      toast.success("Floor created successfully");
      onFloorCreated();
      onOpenChange(false);

      // Reset form
      setFormData({
        name: "",
        level_index: 0,
        map_image_id: "",
        pixels_per_meter: 50,
        map_width: 1920,
        map_height: 1080,
      });
    } catch (error) {
      console.error("Failed to create floor:", error);
      toast.error("Failed to create floor");
    } finally {
      setLoading(false);
    }
  };

  const handleFloorplanSelect = (media: any) => {
    setFormData((prev) => ({
      ...prev,
      map_image_id: media.id,
      map_width: media.width || 1920,
      map_height: media.height || 1080,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Floor</DialogTitle>
          <DialogDescription>
            Add a new floor to start building your navigation graph.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Floor Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g., Ground Floor, First Floor"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="level">Floor Level</Label>
            <Input
              id="level"
              type="number"
              value={formData.level_index}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  level_index: parseInt(e.target.value) || 0,
                }))
              }
              placeholder="0 for ground floor, 1 for first floor, etc."
            />
          </div>

          <div className="space-y-2">
            <Label>Floorplan Image (Optional)</Label>
            <MediaPicker
              onSelect={handleFloorplanSelect}
              trigger={
                <Button variant="outline" type="button" className="w-full">
                  {formData.map_image_id
                    ? "Change Floorplan"
                    : "Select Floorplan"}
                </Button>
              }
              acceptTypes={["image"]}
            />
            {formData.map_image_id && (
              <p className="text-sm text-muted-foreground">
                Floorplan selected ({formData.map_width}x{formData.map_height}
                px)
              </p>
            )}
          </div>

          {formData.map_image_id && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="pixels_per_meter">Pixels per Meter</Label>
                <Input
                  id="pixels_per_meter"
                  type="number"
                  value={formData.pixels_per_meter}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      pixels_per_meter: parseFloat(e.target.value) || 50,
                    }))
                  }
                  step="0.1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Floor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
