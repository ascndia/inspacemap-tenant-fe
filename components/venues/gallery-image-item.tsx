"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  Star,
  StarOff,
  Trash2,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GalleryImage {
  id: string;
  url: string;
  alt: string;
  name: string;
  size: string;
  uploadedAt: string;
  isCover: boolean;
}

interface GalleryImageItemProps {
  image: GalleryImage;
  index: number;
  isFirst: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSetCover?: () => void;
  onRemove?: () => void;
}

export function GalleryImageItem({
  image,
  index,
  isFirst,
  onMoveUp,
  onMoveDown,
  onSetCover,
  onRemove,
}: GalleryImageItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 border rounded-lg bg-card hover:bg-muted/50 transition-colors">
      {/* Drag Handle */}
      <div className="cursor-move text-muted-foreground">
        <GripVertical className="h-5 w-5" />
      </div>

      {/* Image Preview */}
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
        <div className="w-full h-full bg-muted flex items-center justify-center text-muted-foreground">
          <div className="w-8 h-8 bg-muted-foreground/20 rounded" />
        </div>
      </div>

      {/* Image Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium truncate">{image.name}</h4>
          {image.isCover && (
            <Badge variant="default" className="text-xs">
              <Star className="mr-1 h-3 w-3" />
              Cover
            </Badge>
          )}
        </div>
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span>{image.size}</span>
          <span>Uploaded {image.uploadedAt}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-8 w-8 p-0"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onMoveDown}
          className="h-8 w-8 p-0"
        >
          <ArrowDown className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onSetCover}
          disabled={image.isCover}
          className="h-8 w-8 p-0"
        >
          {image.isCover ? (
            <StarOff className="h-4 w-4" />
          ) : (
            <Star className="h-4 w-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
