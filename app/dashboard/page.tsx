import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Building2, MapPin, ImageIcon, Activity } from "lucide-react"
import { mockOrganizations, mockVenues, mockMedia } from "@/lib/api"

export default function DashboardPage() {
  // Using mock data directly for the dashboard overview
  const orgCount = mockOrganizations.length
  const venueCount = mockVenues.length
  const mediaCount = mockMedia.length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orgCount}</div>
            <p className="text-xs text-muted-foreground">Active organizations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Venues</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{venueCount}</div>
            <p className="text-xs text-muted-foreground">Managed venues</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Media</CardTitle>
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mediaCount}</div>
            <p className="text-xs text-muted-foreground">Images and videos</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12</div>
            <p className="text-xs text-muted-foreground">Edits this week</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Edits</CardTitle>
            <CardDescription>Your recent activity across organizations and venues.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Updated Venue Layout</p>
                  <p className="text-sm text-muted-foreground">Grand Plaza Mall - Floor 1</p>
                </div>
                <div className="ml-auto font-medium">Just now</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Uploaded New Media</p>
                  <p className="text-sm text-muted-foreground">Storefront_01.jpg</p>
                </div>
                <div className="ml-auto font-medium">2 hours ago</div>
              </div>
              <div className="flex items-center">
                <div className="ml-4 space-y-1">
                  <p className="text-sm font-medium leading-none">Created New Organization</p>
                  <p className="text-sm text-muted-foreground">Retail Corp Ltd.</p>
                </div>
                <div className="ml-auto font-medium">Yesterday</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks you perform.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {/* Placeholder for quick actions if needed */}
            <div className="flex items-center gap-4 rounded-md border p-4">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Create Organization</p>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-md border p-4">
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <div className="flex-1 space-y-1">
                <p className="text-sm font-medium leading-none">Add New Venue</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
