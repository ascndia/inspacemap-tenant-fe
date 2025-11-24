"use client";

import React, { useState } from "react";
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

interface CloneRevisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sourceRevisionId: string;
  sourceRevisionName: string;
  targetVenueId: string;
  onClone: (newRevision: any) => void;
}

export function CloneRevisionModal({
  isOpen,
  onClose,
  sourceRevisionId,
  targetVenueId,
  sourceRevisionName,
  onClone,
}: CloneRevisionModalProps) {
  const [note, setNote] = useState("");
  const [isCloning, setIsCloning] = useState(false);

  // Reset note when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setNote(`Cloned from ${sourceRevisionName}`);
    }
  }, [isOpen, sourceRevisionName]);

  const handleClone = async () => {
    if (!note.trim()) {
      toast.error("Revision note cannot be empty");
      return;
    }

    try {
      setIsCloning(true);
      const clonedRevision = await GraphRevisionService.cloneRevision(
        sourceRevisionId,
        targetVenueId,
        note.trim()
      );

      // Transform the response to match our revision format
      const newRevision = {
        id: clonedRevision.new_revision_id,
        venue_id: "", // Will be set from context
        status: clonedRevision.status,
        note: clonedRevision.note,
        created_at: clonedRevision.created_at,
        created_by: clonedRevision.created_by,
        floors: [], // Will be populated when loaded
      };

      onClone(newRevision);
      toast.success("Revision cloned successfully");
      onClose();
    } catch (error) {
      console.error("Failed to clone revision:", error);
      toast.error("Failed to clone revision");
    } finally {
      setIsCloning(false);
    }
  };

  const handleClose = () => {
    setNote("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clone Revision</DialogTitle>
          <DialogDescription>
            Create a copy of "{sourceRevisionName}". The cloned revision will
            contain all the same floors, nodes, and connections as the source
            revision.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="note">Revision Note</Label>
            <Textarea
              id="note"
              placeholder="Describe the purpose of this cloned revision..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isCloning}>
            Cancel
          </Button>
          <Button onClick={handleClone} disabled={isCloning || !note.trim()}>
            {isCloning ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cloning...
              </>
            ) : (
              "Clone Revision"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
