"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";

export function VenueDialog() {
  return (
    <Link href="/dashboard/venues/create">
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Venue
      </Button>
    </Link>
  );
}
