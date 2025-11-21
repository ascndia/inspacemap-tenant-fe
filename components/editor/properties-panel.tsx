"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function PropertiesPanel() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Properties</h3>
      </div>

      <Tabs defaultValue="node" className="flex-1 flex flex-col">
        <div className="px-4 pt-4">
          <TabsList className="w-full">
            <TabsTrigger value="node" className="flex-1">
              Node
            </TabsTrigger>
            <TabsTrigger value="edge" className="flex-1">
              Connection
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">
              Settings
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <TabsContent value="node" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input defaultValue="Lobby" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Position X</Label>
                <Input type="number" defaultValue="300" />
              </div>
              <div className="space-y-2">
                <Label>Position Y</Label>
                <Input type="number" defaultValue="150" />
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Panorama Image</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select image..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lobby">lobby_360.jpg</SelectItem>
                  <SelectItem value="hall">hallway_360.jpg</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" className="w-full mt-2 bg-transparent">
                Upload New
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Initial Heading</Label>
              <div className="flex items-center gap-2">
                <Input type="range" min="0" max="360" className="flex-1" />
                <span className="text-xs w-8">0°</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="edge" className="space-y-4 mt-0">
            <div className="p-4 text-center text-muted-foreground text-sm border border-dashed rounded-lg">
              Select a connection to edit properties
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4 mt-0">
            <div className="space-y-2">
              <Label>Grid Size</Label>
              <Input type="number" defaultValue="20" />
            </div>
            <div className="space-y-2">
              <Label>Snap to Grid</Label>
              <Select defaultValue="on">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="on">Enabled</SelectItem>
                  <SelectItem value="off">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <div className="p-4 border-t bg-muted/10">
        <Button className="w-full">Apply Changes</Button>
      </div>
    </div>
  )
}
