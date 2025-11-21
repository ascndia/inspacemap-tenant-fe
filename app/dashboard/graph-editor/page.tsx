"use client"

import { useState } from "react"
import { GraphCanvas } from "@/components/editor/graph-canvas"
import { PropertiesPanel } from "@/components/editor/properties-panel"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Eye, Save, Share2 } from "lucide-react"

export default function GraphEditorPage() {
  const [isPreviewMode, setIsPreviewMode] = useState(false)

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      {/* Header Controls */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-semibold md:text-2xl">Graph Editor</h1>
          <div className="flex items-center gap-2">
            <Select defaultValue="venue1">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="venue1">Grand Plaza Mall</SelectItem>
                <SelectItem value="venue2">Tech Hub Office</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="floor1">
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select floor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="floor1">Floor 1</SelectItem>
                <SelectItem value="floor2">Floor 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={isPreviewMode ? "default" : "outline"} onClick={() => setIsPreviewMode(!isPreviewMode)}>
            <Eye className="mr-2 h-4 w-4" />
            {isPreviewMode ? "Edit Mode" : "Preview 3D"}
          </Button>
          <Button variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button>
            <Save className="mr-2 h-4 w-4" />
            Save Graph
          </Button>
        </div>
      </div>

      {/* Editor Workspace */}
      <div className="flex-1 flex gap-4 min-h-0 border rounded-lg overflow-hidden bg-background">
        {/* Main Canvas */}
        <div className="flex-1 relative">
          {isPreviewMode ? (
            <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p>Initializing 3D Engine...</p>
                <p className="text-sm text-gray-400">Simulating panorama view</p>
              </div>
            </div>
          ) : (
            <GraphCanvas />
          )}
        </div>

        {/* Properties Sidebar */}
        <div className="w-80 border-l bg-background hidden lg:block">
          <PropertiesPanel />
        </div>
      </div>
    </div>
  )
}
