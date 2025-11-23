"use client";

import { useAuthStore } from "@/lib/stores/auth-store";

export interface AccessControlOptions {
  permission?: string | string[];
  role?: string | string[];
  requireAllPermissions?: boolean;
  requireAllRoles?: boolean;
}

export function useAccessControl(options: AccessControlOptions = {}) {
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const {
    permission,
    role,
    requireAllPermissions = false,
    requireAllRoles = false,
  } = options;

  // Check authentication
  const isAuthenticated = !!user;

  // Check permissions
  let hasRequiredPermissions = true;
  if (permission) {
    if (typeof permission === "string") {
      hasRequiredPermissions = hasPermission(permission);
    } else if (Array.isArray(permission)) {
      if (requireAllPermissions) {
        hasRequiredPermissions = permission.every((perm) =>
          hasPermission(perm)
        );
      } else {
        hasRequiredPermissions = permission.some((perm) => hasPermission(perm));
      }
    }
  }

  // Check roles
  let hasRequiredRoles = true;
  if (role && user) {
    if (typeof role === "string") {
      hasRequiredRoles = user.role === role;
    } else if (Array.isArray(role)) {
      if (requireAllRoles) {
        hasRequiredRoles = role.every((r) => user.role === r);
      } else {
        hasRequiredRoles = role.includes(user.role);
      }
    }
  }

  // Overall access
  const hasAccess =
    isAuthenticated && hasRequiredPermissions && hasRequiredRoles;

  // Utility function to check specific permissions
  const canAccess = (permissionToCheck: string) => {
    return hasPermission(permissionToCheck);
  };

  return {
    user,
    isAuthenticated,
    hasAccess,
    hasRequiredPermissions,
    hasRequiredRoles,
    canAccess,
    // Utility functions
    canEdit: hasPermission("venue:update") || hasPermission("venue:create"),
    canDelete: hasPermission("venue:delete"),
    canCreate: hasPermission("venue:create"),
    canRead: hasPermission("venue:read"),
    isOwner: user?.role === "owner",
    isEditor: user?.role === "editor",
    isViewer: user?.role === "viewer",
    isAdmin: user?.role === "admin",
  };
}
