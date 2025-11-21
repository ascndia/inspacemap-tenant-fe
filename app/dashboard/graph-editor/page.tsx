"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, GitBranch, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function GraphEditorPage() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push("/dashboard/venues");
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/venues">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-semibold md:text-2xl">Graph Editor</h1>
          <p className="text-sm text-muted-foreground">
            Legacy route - redirecting to new revision management
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            Route Moved
          </CardTitle>
          <CardDescription>
            The graph editor has been moved to a new location as part of venue
            revision management.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <p className="text-sm">
              Graph editing is now organized under venue revisions. Each venue
              can have multiple graph revisions, and the editor is accessible
              through:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 ml-4">
              <li>
                • <strong>Venue Details</strong> → "See Revisions" button
              </li>
              <li>
                • <strong>Revision List</strong> → Select a revision → "Edit"
                button
              </li>
              <li>
                • <strong>Direct Path:</strong>{" "}
                /venues/[venueId]/revision/[revisionId]/editor
              </li>
            </ul>
          </div>

          <div className="flex gap-3">
            <Link href="/dashboard/venues">
              <Button>
                <GitBranch className="mr-2 h-4 w-4" />
                Go to Venues
              </Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/venues")}
            >
              Continue to Venues (5s)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
