import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthState, User } from "@/types/auth";

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      hasPermission: (permission) => {
        const { user } = get();
        return user?.permissions?.includes(permission) || false;
      },
    }),
    { name: "auth-storage" }
  )
);
