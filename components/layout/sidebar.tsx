"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Building2,
  MapPin,
  ImageIcon,
  User,
  Settings,
  LogOut,
  FileClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/stores/auth-store";
import { useUIStore } from "@/lib/stores/ui-store";
import { toast } from "sonner";

const sidebarItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Organization",
    href: "/dashboard/organizations",
    icon: Building2,
  },
  {
    title: "My Venues",
    href: "/dashboard/venues",
    icon: MapPin,
  },
  {
    title: "Media Library",
    href: "/dashboard/media",
    icon: ImageIcon,
  },
  {
    title: "Audit Log",
    href: "/dashboard/audit-log",
    icon: FileClock,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed } = useUIStore();

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div
      className={cn(
        "hidden border-r bg-muted/40 md:block h-screen sticky top-0 transition-all duration-300",
        sidebarCollapsed ? "md:w-16" : "md:w-64 lg:w-72"
      )}
    >
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div
          className={cn(
            "flex h-14 items-center border-b lg:h-[60px]",
            sidebarCollapsed ? "px-2 justify-center" : "px-4 lg:px-6"
          )}
        >
          <Link
            href="/"
            className={cn(
              "flex items-center gap-2 font-semibold",
              sidebarCollapsed && "justify-center"
            )}
          >
            <Building2 className="h-6 w-6 text-primary" />
            {!sidebarCollapsed && <span className="">Inspacemap</span>}
          </Link>
        </div>
        <ScrollArea className="flex-1">
          <nav
            className={cn(
              "grid items-start text-sm font-medium",
              sidebarCollapsed ? "px-1" : "px-2 lg:px-4"
            )}
          >
            {sidebarItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                  pathname === item.href
                    ? "bg-muted text-primary"
                    : "text-muted-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.title : undefined}
              >
                <item.icon className="h-4 w-4" />
                {!sidebarCollapsed && item.title}
              </Link>
            ))}
          </nav>
        </ScrollArea>
        <div
          className={cn("mt-auto border-t", sidebarCollapsed ? "p-2" : "p-4")}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-2",
                  sidebarCollapsed ? "px-1 justify-center" : "px-2"
                )}
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src="/placeholder-user.jpg"
                    alt={user?.full_name || "User"}
                  />
                  <AvatarFallback>
                    {user ? getInitials(user.full_name) : "U"}
                  </AvatarFallback>
                </Avatar>
                {!sidebarCollapsed && (
                  <div className="flex flex-col items-start text-left">
                    <span className="truncate text-sm font-medium">
                      {user?.full_name || "User"}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {user?.email || ""}
                    </span>
                  </div>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
