"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MediaLibrary } from "@/components/media/media-library";
import { ImageIcon, Check } from "lucide-react";
import type { MediaItem } from "@/types/media";

interface MediaPickerProps {
  onSelect: (media: any) => void;
  selectedMediaId?: string;
  trigger?: React.ReactNode;
  multiple?: boolean;
  acceptTypes?: string[];
  onUploadSuccess?: (media: MediaItem) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function MediaPicker({
  onSelect,
  selectedMediaId,
  trigger,
  multiple = false,
  acceptTypes = ["image", "video"],
  onUploadSuccess,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
}: MediaPickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // Use external open state if provided, otherwise use internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const handleSelect = (media: MediaItem | MediaItem[] | null) => {
    if (media) {
      onSelect(media);
      if (!multiple) {
        setOpen(false);
      }
    }
  };

  const handleConfirmSelection = () => {
    // This will be called from MediaLibrary when multiple selection is confirmed
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="w-full justify-start">
            <ImageIcon className="mr-2 h-4 w-4" />
            {selectedMediaId ? "Change Media" : "Select Media"}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="w-screen min-w-[95vw] h-[95vh] max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Select Media
            {selectedMediaId && (
              <span className="text-sm font-normal text-muted-foreground truncate">
                (Currently selected: {selectedMediaId})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <div className="h-full overflow-auto">
            <MediaLibrary
              mode="select"
              multiple={multiple}
              onSelect={handleSelect}
              onConfirmSelection={handleConfirmSelection}
            />
          </div>
        </div>
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t bg-muted/20 shrink-0">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
