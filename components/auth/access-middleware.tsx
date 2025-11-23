"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/stores/auth-store";
import { toast } from "sonner";

interface RouteAccessRule {
  path: string | RegExp;
  requiredPermission?: string | string[];
  requiredRole?: string | string[];
  requireAllPermissions?: boolean;
  requireAllRoles?: boolean;
  redirectTo?: string;
  fallbackMessage?: string;
}

interface AccessMiddlewareProps {
  rules?: RouteAccessRule[];
  children: React.ReactNode;
}

// Default access rules - removed organization and audit-log rules since they're handled by page-level guards
const defaultRules: RouteAccessRule[] = [
  {
    path: /^\/dashboard\/venues\/[^\/]+\/edit$/,
    requiredPermission: "venue:update",
    redirectTo: "/dashboard",
    fallbackMessage: "You don't have permission to edit venues",
  },
  {
    path: /^\/dashboard\/venues\/create$/,
    requiredPermission: "venue:create",
    redirectTo: "/dashboard",
    fallbackMessage: "You don't have permission to create venues",
  },
  // Removed organization and audit-log rules - handled by RoleGuard in page components
];

export function AccessMiddleware({
  rules = defaultRules,
  children,
}: AccessMiddlewareProps) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  useEffect(() => {
    if (!user) return; // Wait for authentication

    // Check each rule
    for (const rule of rules) {
      const pathMatches =
        typeof rule.path === "string"
          ? pathname === rule.path
          : rule.path.test(pathname);

      if (pathMatches) {
        let hasAccess = true;
        let reason = "";

        // Check permissions
        if (rule.requiredPermission) {
          if (typeof rule.requiredPermission === "string") {
            if (!hasPermission(rule.requiredPermission)) {
              hasAccess = false;
              reason = `Missing permission: ${rule.requiredPermission}`;
            }
          } else if (Array.isArray(rule.requiredPermission)) {
            const requiredPerms = rule.requiredPermission;
            if (rule.requireAllPermissions) {
              const hasAll = requiredPerms.every((perm) => hasPermission(perm));
              if (!hasAll) {
                hasAccess = false;
                reason = `Missing one or more permissions: ${requiredPerms.join(
                  ", "
                )}`;
              }
            } else {
              const hasAny = requiredPerms.some((perm) => hasPermission(perm));
              if (!hasAny) {
                hasAccess = false;
                reason = `Missing any of permissions: ${requiredPerms.join(
                  ", "
                )}`;
              }
            }
          }
        }

        // Check roles
        if (hasAccess && rule.requiredRole && user) {
          if (typeof rule.requiredRole === "string") {
            if (user.role !== rule.requiredRole) {
              hasAccess = false;
              reason = `Required role: ${rule.requiredRole}, your role: ${user.role}`;
            }
          } else if (Array.isArray(rule.requiredRole)) {
            const requiredRoles = rule.requiredRole;
            if (rule.requireAllRoles) {
              const hasAll = requiredRoles.every((role) => user.role === role);
              if (!hasAll) {
                hasAccess = false;
                reason = `Missing one or more roles: ${requiredRoles.join(
                  ", "
                )}`;
              }
            } else {
              const hasAny = requiredRoles.includes(user.role);
              if (!hasAny) {
                hasAccess = false;
                reason = `Required any of roles: ${requiredRoles.join(
                  ", "
                )}, your role: ${user.role}`;
              }
            }
          }
        }

        // Handle access denial
        if (!hasAccess) {
          console.warn(`Access denied to ${pathname}:`, reason);

          const message =
            rule.fallbackMessage ||
            "You don't have permission to access this page";
          toast.error(message);

          const redirectPath = rule.redirectTo || "/dashboard";
          router.push(redirectPath);

          break; // Stop checking other rules
        }
      }
    }
  }, [pathname, user, hasPermission, router, rules]);

  return <>{children}</>;
}
