import { VenueList } from "@/components/venues/venue-list"
import { VenueMap } from "@/components/venues/venue-map"
import { VenueDialog } from "@/components/venues/venue-dialog"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

export default function VenuesPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold md:text-2xl">My Venues</h1>
        <VenueDialog />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Sidebar List */}
        <div className="flex flex-col gap-4 lg:col-span-1 h-full">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search venues..." className="pl-8" />
          </div>
          <VenueList />
        </div>

        {/* Map View */}
        <div className="lg:col-span-2 h-full min-h-[400px] rounded-lg border bg-muted/10 p-1">
          <VenueMap />
        </div>
      </div>
    </div>
  )
}
