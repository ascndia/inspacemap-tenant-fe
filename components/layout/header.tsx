"use client";

import { Menu, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Sidebar } from "@/components/layout/sidebar";
import { useUIStore } from "@/lib/stores/ui-store";

export function Header() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* Mobile menu button - only show on mobile */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden bg-transparent"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-72">
          <Sidebar />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar toggle button - only show on desktop */}
      <Button
        variant="outline"
        size="icon"
        className="shrink-0 hidden md:flex bg-transparent"
        onClick={toggleSidebar}
      >
        {sidebarCollapsed ? (
          <PanelLeftOpen className="h-5 w-5" />
        ) : (
          <PanelLeftClose className="h-5 w-5" />
        )}
        <span className="sr-only">Toggle sidebar</span>
      </Button>

      <div className="w-full flex-1">
        <span className="font-semibold">Inspacemap Tenant Portal</span>
      </div>
    </header>
  );
}
