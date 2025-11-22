"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const router = useRouter();
  const { user, token, hydrated } = useAuthStore();

  useEffect(() => {
    console.log("ProtectedRoute: Checking auth state", {
      hasToken: !!token,
      hasUser: !!user,
      hydrated,
    });
    if (hydrated && (!token || !user)) {
      console.log(
        "ProtectedRoute: Hydrated but no token/user, redirecting to login"
      );
      router.push("/login");
    } else if (hydrated) {
      console.log("ProtectedRoute: User authenticated, allowing access");
    } else {
      console.log("ProtectedRoute: Not yet hydrated, waiting...");
    }
  }, [token, user, hydrated, router]);

  if (!hydrated || !token || !user) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
