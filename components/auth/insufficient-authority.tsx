"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldX, ArrowLeft, Home, UserX, Clock } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface InsufficientAuthorityProps {
  title?: string;
  description?: string;
  requiredRole?: string | string[];
  showHomeButton?: boolean;
  showBackButton?: boolean;
  autoRedirectDelay?: number; // in seconds, 0 to disable
  redirectTo?: string;
  className?: string;
}

export function InsufficientAuthority({
  title = "Access Denied",
  description,
  requiredRole,
  showHomeButton = true,
  showBackButton = true,
  autoRedirectDelay = 5,
  redirectTo = "/dashboard",
  className = "",
}: InsufficientAuthorityProps) {
  const [countdown, setCountdown] = useState(autoRedirectDelay);
  const [isRedirecting, setIsRedirecting] = useState(autoRedirectDelay > 0);
  const router = useRouter();

  // 1. FIX: Sync state if the prop changes after the component mounts
  useEffect(() => {
    setCountdown(autoRedirectDelay);
    setIsRedirecting(autoRedirectDelay > 0);
  }, [autoRedirectDelay]);

  // 2. Timer Logic
  useEffect(() => {
    // Only run if we are supposed to be redirecting
    if (!isRedirecting || autoRedirectDelay <= 0) return;

    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      // Redirect when countdown hits 0
      router.push(redirectTo);
    }
  }, [countdown, isRedirecting, autoRedirectDelay, redirectTo, router]);

  const cancelRedirect = () => {
    setIsRedirecting(false);
  };

  const getRoleText = (role: string | string[]) => {
    if (Array.isArray(role)) {
      if (role.length === 1) return role[0];
      return role.slice(0, -1).join(", ") + " or " + role[role.length - 1];
    }
    return role;
  };

  const defaultDescription = requiredRole
    ? `You need ${getRoleText(requiredRole)} privileges to access this page.`
    : "You don't have sufficient privileges to access this page.";

  return (
    <div
      className={`min-h-[400px] flex items-center justify-center p-4 ${className}`}
    >
      <Card className="w-full max-w-md text-center">
        <CardHeader className="space-y-4 flex flex-col items-center justify-center pb-6">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <ShieldX className="w-8 h-8 text-destructive" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="text-base text-center">
              {description || defaultDescription}
            </CardDescription>

            {/* Only show countdown if actively redirecting */}
            {autoRedirectDelay > 0 && isRedirecting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Clock className="w-4 h-4" />
                <span>
                  Redirecting to dashboard in {countdown} second
                  {countdown !== 1 ? "s" : ""}...
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cancelRedirect}
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {showHomeButton && (
              <Link href="/dashboard">
                <Button className="w-full" size="lg">
                  <Home className="mr-2 h-4 w-4" />
                  Go to Dashboard
                </Button>
              </Link>
            )}

            {showBackButton && (
              <Button
                variant="outline"
                className="w-full mt-3"
                size="lg"
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
            )}
          </div>

          <div className="pt-4 border-t">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <UserX className="w-4 h-4" />
              <span>Insufficient Authority</span>
              {autoRedirectDelay > 0 && !isRedirecting && (
                <span className="text-xs">• Auto-redirect cancelled</span>
              )}
              {autoRedirectDelay > 0 && isRedirecting && (
                <span className="text-xs">• Auto-redirect enabled</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
