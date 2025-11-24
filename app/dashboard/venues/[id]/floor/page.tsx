"use client";

import { mockVenues } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Map } from "lucide-react";
import Link from "next/link";
import { PermissionGuard } from "@/components/auth/permission-guard";
import { useParams } from "next/navigation";

export default function VenueFloorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useParams();
  // In a real app, fetch venue by ID
  const venue = mockVenues.find((v) => v.id === id) || mockVenues[0];

  return (
    <PermissionGuard
      permission="venue:update"
      fallback={
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-muted-foreground">
            You don't have permission to manage floor plans
          </p>
          <Link href={`/dashboard/venues/${id}`}>
            <Button className="mt-4">Back to Venue</Button>
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/venues/${id}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-lg font-semibold md:text-2xl">
              {venue.name} - Floor Plans
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage floor plans and levels
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Floor
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {venue.floors.map((floor) => (
            <Card key={floor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{floor.name}</CardTitle>
                  <Badge variant="outline">Level {floor.level}</Badge>
                </div>
                <CardDescription>
                  Floor plan and navigation graph
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted/20 rounded-md flex items-center justify-center mb-4">
                  <Map className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new floor card */}
          <Card className="border-dashed border-2 hover:border-primary/50 transition-colors">
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <Plus className="h-8 w-8 text-muted-foreground mb-2" />
              <h3 className="font-medium text-muted-foreground">
                Add New Floor
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create a new floor plan
              </p>
            </CardContent>
          </Card>
        </div>

        {venue.floors.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Map className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No floors yet</h3>
              <p className="text-muted-foreground mt-2">
                Start by adding your first floor plan to begin mapping your
                venue.
              </p>
              <Button className="mt-4">
                <Plus className="mr-2 h-4 w-4" />
                Add First Floor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PermissionGuard>
  );
}
