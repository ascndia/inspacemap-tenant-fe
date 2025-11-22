import { create } from "zustand";
import type { AuthState, User } from "@/types/auth";

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  hydrated: false,
  login: (token, user) => {
    console.log("Auth Store: Logging in user", user?.email);
    // Store in localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("access_token", token);
      localStorage.setItem("user", JSON.stringify(user));
      console.log("Auth Store: Stored token and user in localStorage");
    }
    set({ token, user, hydrated: true });
  },
  logout: () => {
    console.log("Auth Store: Logging out user");
    // Clear from localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      console.log("Auth Store: Cleared token and user from localStorage");
    }
    set({ token: null, user: null, hydrated: true });
  },
  loadFromStorage: () => {
    console.log("Auth Store: Loading from storage");
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("access_token");
      const userStr = localStorage.getItem("user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log("Auth Store: Loaded token and user from storage", {
            hasToken: !!token,
            hasUser: !!user,
          });
          set({ token, user, hydrated: true });
        } catch (error) {
          console.log("Auth Store: Failed to parse user from storage", error);
          set({ hydrated: true });
        }
      } else {
        console.log("Auth Store: No token/user in storage");
        set({ hydrated: true });
      }
    }
  },
  hasPermission: (permission) => {
    const { user } = get();
    return user?.permissions?.includes(permission) || false;
  },
}));
