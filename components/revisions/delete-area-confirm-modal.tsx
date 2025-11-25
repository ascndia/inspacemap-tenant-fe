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
import { AlertTriangle, Loader2 } from "lucide-react";

interface DeleteAreaConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  venueSlug: string;
  areaName: string;
  isDeleting?: boolean;
}

export function DeleteAreaConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  venueSlug,
  areaName,
  isDeleting = false,
}: DeleteAreaConfirmModalProps) {
  const [confirmationText, setConfirmationText] = useState("");

  const requiredConfirmationText = `${venueSlug}/${areaName}`;

  const handleClose = () => {
    setConfirmationText("");
    onClose();
  };

  const handleConfirm = () => {
    if (confirmationText === requiredConfirmationText) {
      onConfirm();
      setConfirmationText("");
    }
  };

  const isValidConfirmation = confirmationText === requiredConfirmationText;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div>
              <DialogTitle>Delete Area</DialogTitle>
              <DialogDescription className="mt-2">
                This action cannot be undone. This will permanently delete the
                area <strong>{areaName}</strong> and all its gallery items.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="confirmation" className="text-sm font-medium">
              Type{" "}
              <code className="bg-muted px-1 py-0.5 rounded text-xs">
                {requiredConfirmationText}
              </code>{" "}
              to confirm deletion:
            </Label>
            <Input
              id="confirmation"
              placeholder={`Type "${requiredConfirmationText}" to confirm`}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              className={
                confirmationText && !isValidConfirmation
                  ? "border-destructive"
                  : ""
              }
            />
            {confirmationText && !isValidConfirmation && (
              <p className="text-sm text-destructive">
                Confirmation text must match exactly: {requiredConfirmationText}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={!isValidConfirmation || isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete Area"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
