"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Video, Calendar, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface MediaFiltersProps {
  selectedFilters: {
    type: string;
    date: string;
    tags: string[];
  };
  onFilterChange: (filterType: string, value: string | string[]) => void;
}

export function MediaFilters({
  selectedFilters,
  onFilterChange,
}: MediaFiltersProps) {
  const availableTags = [
    "#venue",
    "#interior",
    "#exterior",
    "#360",
    "#panorama",
    "#floorplan",
  ];

  const handleTypeFilter = (type: string) => {
    onFilterChange("type", selectedFilters.type === type ? "all" : type);
  };

  const handleDateFilter = (date: string) => {
    onFilterChange("date", selectedFilters.date === date ? "all" : date);
  };

  const handleTagToggle = (tag: string) => {
    const newTags = selectedFilters.tags.includes(tag)
      ? selectedFilters.tags.filter((t) => t !== tag)
      : [...selectedFilters.tags, tag];
    onFilterChange("tags", newTags);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">
            Media Type
          </Label>
          <div className="flex flex-col gap-1">
            <Button
              variant={selectedFilters.type === "image" ? "default" : "ghost"}
              className="justify-start font-normal h-8"
              onClick={() => handleTypeFilter("image")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Images
              <Badge variant="secondary" className="ml-auto text-xs">
                12
              </Badge>
            </Button>
            <Button
              variant={selectedFilters.type === "video" ? "default" : "ghost"}
              className="justify-start font-normal h-8"
              onClick={() => handleTypeFilter("video")}
            >
              <Video className="mr-2 h-4 w-4" />
              Videos
              <Badge variant="secondary" className="ml-auto text-xs">
                3
              </Badge>
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">
            Upload Date
          </Label>
          <div className="flex flex-col gap-1">
            <Button
              variant={selectedFilters.date === "7days" ? "default" : "ghost"}
              className="justify-start font-normal h-8"
              onClick={() => handleDateFilter("7days")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Last 7 days
            </Button>
            <Button
              variant={selectedFilters.date === "30days" ? "default" : "ghost"}
              className="justify-start font-normal h-8"
              onClick={() => handleDateFilter("30days")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Last 30 days
            </Button>
            <Button
              variant={selectedFilters.date === "90days" ? "default" : "ghost"}
              className="justify-start font-normal h-8"
              onClick={() => handleDateFilter("90days")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Last 90 days
            </Button>
            <Button
              variant={selectedFilters.date === "year" ? "default" : "ghost"}
              className="justify-start font-normal h-8"
              onClick={() => handleDateFilter("year")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              This year
            </Button>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground font-medium">
            Tags
          </Label>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={
                  selectedFilters.tags.includes(tag) ? "default" : "outline"
                }
                className={cn(
                  "cursor-pointer hover:bg-muted transition-colors",
                  selectedFilters.tags.includes(tag) &&
                    "bg-primary text-primary-foreground"
                )}
                onClick={() => handleTagToggle(tag)}
              >
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
