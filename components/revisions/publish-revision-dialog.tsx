"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertTriangle } from "lucide-react";
import { GraphRevisionService } from "@/lib/services/graph-revision-service";
import { useToast } from "@/hooks/use-toast";

interface PublishRevisionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  revisionId: string;
  revisionName: string;
  onSuccess?: () => void;
}

export function PublishRevisionDialog({
  isOpen,
  onClose,
  revisionId,
  revisionName,
  onSuccess,
}: PublishRevisionDialogProps) {
  const [publishNote, setPublishNote] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const handlePublishClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirmPublish = async () => {
    setShowConfirmation(false);
    setIsPublishing(true);
    try {
      await GraphRevisionService.publishRevision(
        revisionId,
        publishNote || undefined
      );

      toast({
        title: "Success",
        description:
          "Revision published successfully! A new draft has been created for future edits.",
      });

      onClose();
      setPublishNote("");

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Failed to publish revision:", err);
      toast({
        title: "Publish Failed",
        description: err.message || "Failed to publish revision",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (!isPublishing) {
      onClose();
      setPublishNote("");
      setShowConfirmation(false);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Publish Graph Changes</DialogTitle>
            <p className="text-sm text-muted-foreground">
              This will make "{revisionName}" live for all users. A new draft
              will be created for future edits.
            </p>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="publish-note">Release Notes (Optional)</Label>
              <Textarea
                id="publish-note"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                placeholder="Describe the changes in this version..."
                rows={3}
                maxLength={255}
                disabled={isPublishing}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {publishNote.length}/255 characters
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePublishClick}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              Publish Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              <div>
                <DialogTitle>Confirm Publish</DialogTitle>
                <DialogDescription className="mt-2">
                  Are you sure you want to publish this revision? This will make
                  the changes live for all users and create a new draft for
                  future edits.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmation(false)}
              disabled={isPublishing}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPublish}
              disabled={isPublishing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isPublishing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Publishing...
                </>
              ) : (
                "Yes, Publish"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
