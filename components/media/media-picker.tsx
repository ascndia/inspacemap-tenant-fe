"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ImageIcon } from "lucide-react"
import { MediaLibrary } from "@/components/media/media-library"

interface MediaPickerProps {
  onSelect: (media: any) => void
  trigger?: React.ReactNode
}

export function MediaPicker({ onSelect, trigger }: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  const handleSelect = (media: any) => {
    onSelect(media)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <ImageIcon className="mr-2 h-4 w-4" />
            Select Media
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Media Library</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-hidden">
          <MediaLibrary mode="select" onSelect={handleSelect} />
        </div>
      </DialogContent>
    </Dialog>
  )
}
