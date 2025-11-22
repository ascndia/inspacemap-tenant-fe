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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { toast } from "sonner";

interface EditRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  revisionId: string;
  currentNote: string;
  onUpdate: (updatedRevision: any) => void;
}

export function EditRevisionModal({
  isOpen,
  onClose,
  revisionId,
  currentNote,
  onUpdate,
}: EditRevisionModalProps) {
  const [note, setNote] = useState(currentNote);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async () => {
    if (!note.trim()) {
      toast.error("Revision note cannot be empty");
      return;
    }

    try {
      setIsUpdating(true);
      const updatedRevision = await GraphRevisionService.updateRevision(
        revisionId,
        { note: note.trim() }
      );
      onUpdate(updatedRevision);
      toast.success("Revision note updated successfully");
      onClose();
    } catch (error) {
      console.error("Failed to update revision:", error);
      toast.error("Failed to update revision note");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleClose = () => {
    setNote(currentNote);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Revision Note</DialogTitle>
          <DialogDescription>
            Update the note for this revision. This helps identify and describe
            the changes made in this revision.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Revision Note</Label>
            <Textarea
              id="note"
              placeholder="Describe the changes in this revision..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={isUpdating || !note.trim()}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Update Note"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
