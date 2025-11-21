import { mockVenues } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { VenueGallery } from "@/components/venues/venue-gallery"
import { ArrowLeft, Save } from "lucide-react"
import Link from "next/link"

export default function VenueDetailPage({ params }: { params: { id: string } }) {
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === params.id) || mockVenues[0]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/venues">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">{venue.name}</h1>
          <p className="text-sm text-muted-foreground">Manage venue details and assets</p>
        </div>
        <Button>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>

      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="gallery">Gallery</TabsTrigger>
          <TabsTrigger value="floors">Floors</TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
              <CardDescription>Basic information about the venue.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Venue Name</Label>
                <Input id="name" defaultValue={venue.name} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" defaultValue={venue.address} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Enter venue description..." className="min-h-[100px]" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <Card>
            <CardHeader>
              <CardTitle>Media Gallery</CardTitle>
              <CardDescription>Manage images and videos for this venue.</CardDescription>
            </CardHeader>
            <CardContent>
              <VenueGallery />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="floors">
          <Card>
            <CardHeader>
              <CardTitle>Floor Management</CardTitle>
              <CardDescription>Configure floors and levels.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground">Floor management interface would go here.</div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
