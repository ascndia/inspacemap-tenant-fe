import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";
import jwtDecode from "jwt-decode";

export function useAuth() {
  const { user, token, logout } = useAuthStore();

  useEffect(() => {
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        if (decoded.exp * 1000 < Date.now()) {
          logout(); // Token expired
        }
      } catch (error) {
        logout(); // Invalid token
      }
    }
  }, [token, logout]);

  return { user, token, logout };
}
