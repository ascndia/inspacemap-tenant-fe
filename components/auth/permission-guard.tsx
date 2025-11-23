"use client";

import { useAuthStore } from "@/lib/stores/auth-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShieldX } from "lucide-react";
import { InsufficientAuthority } from "./insufficient-authority";

interface PermissionGuardProps {
  permission: string | string[];
  fallback?: React.ReactNode;
  requireAll?: boolean; // If true, user must have ALL permissions; if false, user must have ANY
  children: React.ReactNode;
}

export function PermissionGuard({
  permission,
  fallback,
  requireAll = false,
  children,
}: PermissionGuardProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const user = useAuthStore((state) => state.user);

  // Default fallback
  const defaultFallback = (
    <InsufficientAuthority
      title="Permission Required"
      description="You don't have the necessary permissions to access this feature."
    />
  );

  // Check if user is authenticated
  if (!user) {
    return <>{fallback || defaultFallback}</>;
  }

  // Handle single permission
  if (typeof permission === "string") {
    if (!hasPermission(permission)) {
      return <>{fallback || defaultFallback}</>;
    }
  }

  // Handle multiple permissions
  if (Array.isArray(permission)) {
    if (requireAll) {
      // User must have ALL permissions
      const hasAllPermissions = permission.every((perm) => hasPermission(perm));
      if (!hasAllPermissions) {
        return <>{fallback || defaultFallback}</>;
      }
    } else {
      // User must have ANY of the permissions
      const hasAnyPermission = permission.some((perm) => hasPermission(perm));
      if (!hasAnyPermission) {
        return <>{fallback || defaultFallback}</>;
      }
    }
  }

  return <>{children}</>;
}
