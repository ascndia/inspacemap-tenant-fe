"use client";

import type React from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">{children}</div>
    </ProtectedRoute>
  );
}
