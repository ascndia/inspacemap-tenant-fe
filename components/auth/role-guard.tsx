"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";
import { InsufficientAuthority } from "./insufficient-authority";

interface RoleGuardProps {
  role: string | string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL roles; if false, user must have ANY
  children: React.ReactNode;
}

export function RoleGuard({
  role,
  fallback,
  requireAll = false,
  children,
}: RoleGuardProps) {
  const user = useAuthStore((state) => state.user);

  // Default fallback
  const defaultFallback = (
    <InsufficientAuthority
      title="Role Required"
      description="You don't have the required role to access this feature."
    />
  );

  // Check if user is authenticated
  if (!user) {
    return <>{fallback || defaultFallback}</>;
  }

  // Handle single role
  if (typeof role === "string") {
    if (user.role !== role) {
      return <>{fallback || defaultFallback}</>;
    }
  }

  // Handle multiple roles
  if (Array.isArray(role)) {
    if (requireAll) {
      // User must have ALL roles (though this is unusual for roles)
      const hasAllRoles = role.every((r) => user.role === r);
      if (!hasAllRoles) {
        return <>{fallback || defaultFallback}</>;
      }
    } else {
      // User must have ANY of the roles
      const hasAnyRole = role.includes(user.role);
      if (!hasAnyRole) {
        return <>{fallback || defaultFallback}</>;
      }
    }
  }

  return <>{children}</>;
}
