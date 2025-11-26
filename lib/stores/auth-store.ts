import { create } from "zustand";
import type { AuthState, User } from "@/types/auth";

// JWT decoding utility
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map(function (c) {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    return payload;
  } catch (error) {
    console.error("❌ Failed to decode JWT:", error);
    return null;
  }
}

// Extract user info from JWT or API response
function extractUserInfo(token: string, apiUser?: any): User {
  const jwtPayload = decodeJWT(token);

  if (jwtPayload && (jwtPayload.user_id || jwtPayload.email)) {
    // JWT contains user info directly in payload (not nested)
    console.log("📋 Using user data from JWT:", jwtPayload);

    return {
      id: jwtPayload.user_id || jwtPayload.id || jwtPayload.sub,
      email: jwtPayload.email,
      full_name:
        jwtPayload.full_name ||
        jwtPayload.name ||
        apiUser?.full_name ||
        "Unknown User",
      organization_id: jwtPayload.org_id || jwtPayload.organization_id,
      role: jwtPayload.role,
      permissions: jwtPayload.perms || jwtPayload.permissions || [],
    };
  } else if (apiUser) {
    // Fallback to API response user data - now with single organization
    console.log("📋 Using user data from API response:", apiUser);

    return {
      id: apiUser.id,
      email: apiUser.email,
      full_name: apiUser.full_name || apiUser.name,
      organization_id: apiUser.organization?.organization_id,
      role: apiUser.organization?.role_name || apiUser.role || "user",
      permissions: apiUser.permissions || [],
    };
  }

  throw new Error(
    "Unable to extract user information from token or API response"
  );
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  login: (token, user) => {
    try {
      // Extract user info from JWT or API response
      const userInfo = extractUserInfo(token, user);

      // Store in localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("access_token", token);
        localStorage.setItem("user", JSON.stringify(userInfo));

        // Store current organization info if available
        if (user?.organization) {
          localStorage.setItem(
            "current_org",
            JSON.stringify(user.organization)
          );
        }
      }

      set({ token, user: userInfo, hydrated: true });
    } catch (error) {
      // Fallback to basic user info if extraction fails
      const fallbackUser = user || {
        id: "unknown",
        email: "unknown",
        role: "user",
        permissions: [],
      };
      set({ token, user: fallbackUser, hydrated: true });
    }
  },
  logout: () => {
    // Clear from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      localStorage.removeItem("current_org");
    }
    set({ token: null, user: null, hydrated: true });
  },
  loadFromStorage: () => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("user");

      if (token) {
        try {
          // Try to extract fresh user info from JWT
          const userInfo = extractUserInfo(token);

          set({ token, user: userInfo, hydrated: true });
        } catch (error) {
          // Fallback to stored user data
          if (userStr) {
            try {
              const user = JSON.parse(userStr);
              console.log("📋 Auth Store: Using stored user data", {
                id: user.id,
                email: user.email,
                role: user.role,
                permissionsCount: user.permissions?.length || 0,
                permissions: user.permissions,
                organization_id: user.organization_id,
                full_name: user.full_name,
              });
              set({ token, user, hydrated: true });
            } catch (parseError) {
              console.log(
                "❌ Auth Store: Failed to parse stored user",
                parseError
              );
              set({ token, user: null, hydrated: true });
            }
          } else {
            console.log(
              "📭 Auth Store: No stored user data, keeping token only"
            );
            set({ token, user: null, hydrated: true });
          }
        }
      } else {
        console.log("🚫 Auth Store: No token in storage");
        set({ hydrated: true });
      }
    }
  },
  hasPermission: (permission) => {
    const { user } = get();
    const hasPerm = user?.permissions?.includes(permission) || false;
    return hasPerm;
  },
  hasRole: (role: string) => {
    const { user } = get();
    const hasRole = user?.role === role;
    return hasRole;
  },
  hasAnyRole: (roles: string[]) => {
    const { user } = get();
    const hasAny = user?.role ? roles.includes(user.role) : false;
    return hasAny;
  },
  isTokenExpired: () => {
    const { token } = get();
    if (!token) {
      console.log("⏰ Token expired check: No token = EXPIRED");
      return true;
    }

    try {
      const payload = decodeJWT(token);
      if (!payload || !payload.exp) {
        console.log(
          "⏰ Token expired check: No exp claim = NOT EXPIRED (assuming valid)"
        );
        return false;
      }

      const isExpired = payload.exp * 1000 < Date.now();
      const expiryDate = new Date(payload.exp * 1000);

      return isExpired;
    } catch {
      console.log(
        "⏰ Token expired check: Decode failed = NOT EXPIRED (fallback)"
      );
      return false;
    }
  },
  getTokenExpiry: () => {
    const { token } = get();
    if (!token) return null;

    try {
      const payload = decodeJWT(token);
      return payload?.exp ? new Date(payload.exp * 1000) : null;
    } catch {
      return null;
    }
  },
  // Debug utility to inspect current JWT
  inspectJWT: () => {
    const { token } = get();
    if (!token) {
      console.log("🔍 JWT Inspection: No token available");
      return null;
    }

    const payload = decodeJWT(token);

    return payload;
  },
  // Get current organization info
  getCurrentOrg: () => {
    if (typeof window === "undefined") return null;

    const currentOrgStr = localStorage.getItem("current_org");
    if (currentOrgStr) {
      try {
        return JSON.parse(currentOrgStr);
      } catch (error) {
        console.error("❌ Failed to parse current_org:", error);
        return null;
      }
    }
    return null;
  },
}));
