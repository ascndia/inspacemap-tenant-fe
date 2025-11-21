"use client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, MapPin } from "lucide-react"

export function VenueDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Venue
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Venue Details</DialogTitle>
          <DialogDescription>Manage venue information, location, and floors.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="details" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="galleries">Galleries</TabsTrigger>
            <TabsTrigger value="floors">Floors</TabsTrigger>
          </TabsList>
          <div className="flex-1 overflow-y-auto py-4">
            <TabsContent value="details" className="space-y-4 mt-0">
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Venue Name</Label>
                  <Input id="name" placeholder="e.g. Grand Plaza Mall" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="address">Address</Label>
                  <div className="flex gap-2">
                    <Input id="address" placeholder="123 Main St, City" className="flex-1" />
                    <Button variant="outline" size="icon">
                      <MapPin className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea id="description" placeholder="Describe the venue..." />
                </div>
              </div>
            </TabsContent>
            <TabsContent value="galleries" className="space-y-4 mt-0">
              <div className="grid grid-cols-3 gap-4">
                <div className="aspect-square rounded-md border border-dashed flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Upload Image</span>
                </div>
                {/* Placeholders for uploaded images */}
                <div className="aspect-square rounded-md bg-muted relative group overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </div>
                </div>
                <div className="aspect-square rounded-md bg-muted relative group overflow-hidden">
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="secondary" size="sm">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="floors" className="space-y-4 mt-0">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">Venue Floors</h4>
                <Button size="sm" variant="outline">
                  <Plus className="mr-2 h-3 w-3" />
                  Add Floor
                </Button>
              </div>
              <div className="space-y-2">
                {[1, 2, 3].map((floor) => (
                  <div key={floor} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {floor}
                      </div>
                      <div>
                        <p className="text-sm font-medium">Floor {floor}</p>
                        <p className="text-xs text-muted-foreground">24 nodes • Updated 2d ago</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </div>
        </Tabs>
        <DialogFooter>
          <Button variant="outline">Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
