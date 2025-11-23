"use client";

import { VenueList } from "@/components/venues/venue-list";
import { VenueMap } from "@/components/venues/venue-map";
import { CreateVenueDialog } from "@/components/venues/create-venue-dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { useState } from "react";
import { useAccessControl } from "@/lib/hooks/use-access-control";

export default function VenuesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { canAccess } = useAccessControl();

  const handleVenueCreated = () => {
    // Trigger a refresh of the venue list
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] gap-4">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-semibold md:text-2xl">My Venues</h1>
        {canAccess({ permission: "venue:create" }) && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Venue
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Sidebar List */}
        <div className="flex flex-col gap-4 lg:col-span-1 h-full">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search venues..."
              className="pl-8"
            />
          </div>
          <VenueList refreshTrigger={refreshTrigger} />
        </div>

        {/* Map View */}
        <div className="lg:col-span-2 h-full min-h-[400px] rounded-lg border bg-muted/10 p-1">
          <VenueMap />
        </div>
      </div>

      <CreateVenueDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleVenueCreated}
      />
    </div>
  );
}
