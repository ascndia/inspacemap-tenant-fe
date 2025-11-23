"use client";

import type React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { AccessMiddleware } from "@/components/auth/access-middleware";
import { useUIStore } from "@/lib/stores/ui-store";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <AccessMiddleware>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </AccessMiddleware>
    </ProtectedRoute>
  );
}

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  const gridCols = sidebarCollapsed
    ? "md:grid-cols-[64px_1fr]"
    : "md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]";

  return (
    <div className={`grid min-h-screen w-full ${gridCols}`}>
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
