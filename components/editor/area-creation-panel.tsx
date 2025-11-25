"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Check, Square } from "lucide-react";

interface AreaCreationPanelProps {
  drawingAreaVertices: { x: number; y: number }[];
  onCancel: () => void;
  onCreateArea: (areaData: {
    name: string;
    category: string;
    description?: string;
  }) => void;
}

export function AreaCreationPanel({
  drawingAreaVertices,
  onCancel,
  onCreateArea,
}: AreaCreationPanelProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("default");
  const [description, setDescription] = useState("");

  const handleCreate = () => {
    if (!name.trim()) {
      alert("Area name is required");
      return;
    }

    onCreateArea({
      name: name.trim(),
      category,
      description: description.trim() || undefined,
    });
  };

  const canCreate = drawingAreaVertices.length >= 3 && name.trim();

  return (
    <div className="h-full bg-background border-l p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Square className="h-4 w-4 text-blue-500" />
          <h3 className="font-semibold">Create Area</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Area Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Name *</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter area name"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="room">Room</SelectItem>
                <SelectItem value="corridor">Corridor</SelectItem>
                <SelectItem value="staircase">Staircase</SelectItem>
                <SelectItem value="elevator">Elevator</SelectItem>
                <SelectItem value="entrance">Entrance</SelectItem>
                <SelectItem value="exit">Exit</SelectItem>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="garden">Garden</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter area description (optional)"
            />
          </div>

          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              <strong>Vertices:</strong> {drawingAreaVertices.length}
            </p>
            <p className="text-orange-600">
              {drawingAreaVertices.length < 3 &&
                "Need at least 3 vertices to create an area"}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 mt-4">
        <Button variant="outline" onClick={onCancel} className="flex-1">
          Cancel
        </Button>
        <Button onClick={handleCreate} disabled={!canCreate} className="flex-1">
          <Check className="h-4 w-4 mr-2" />
          Create Area
        </Button>
      </div>
    </div>
  );
}
