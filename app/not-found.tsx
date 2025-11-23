"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, Search, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
            <Search className="w-12 h-12 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-4xl font-bold text-primary">
              404
            </CardTitle>
            <CardTitle className="text-xl">Page Not Found</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <CardDescription className="text-base">
            Sorry, we couldn't find the page you're looking for. It might have
            been moved, deleted, or you entered the wrong URL.
          </CardDescription>

          <div className="space-y-3">
            <Link href="/dashboard">
              <Button className="w-full" size="lg">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full mt-3"
              size="lg"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
