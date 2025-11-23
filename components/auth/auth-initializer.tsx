"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth-store";

export function AuthInitializer() {
  useEffect(() => {
    useAuthStore.getState().loadFromStorage();
  }, []);

  return null;
}
