"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MediaGrid } from "@/components/media/media-grid"
import { MediaUpload } from "@/components/media/media-upload"
import { MediaFilters } from "@/components/media/media-filters"
import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"

interface MediaLibraryProps {
  mode?: "manage" | "select"
  onSelect?: (media: any) => void
}

export function MediaLibrary({ mode = "manage", onSelect }: MediaLibraryProps) {
  const [activeTab, setActiveTab] = useState("library")

  return (
    <div className="flex flex-col h-full gap-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="library">Library</TabsTrigger>
            <TabsTrigger value="upload">Upload</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="library" className="flex-1 mt-0">
          <div className="flex flex-col md:flex-row gap-6 h-full">
            <div className="w-full md:w-64 shrink-0">
              <MediaFilters />
            </div>
            <div className="flex-1">
              {/* In a real app, we'd pass a selection handler to MediaGrid if mode is 'select' */}
              <MediaGrid />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="mt-0">
          <div className="max-w-2xl mx-auto mt-8">
            <MediaUpload />
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={() => setActiveTab("library")}>
                Back to Library
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {mode === "select" && (
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button onClick={() => onSelect?.(null)}>Select</Button>
        </DialogFooter>
      )}
    </div>
  )
}
