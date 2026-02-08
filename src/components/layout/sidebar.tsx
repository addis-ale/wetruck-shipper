"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  MapPin,
  Boxes,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Documents", href: "/dashboard/organazation/documents", icon: Upload },
  { name: "My Shipments", href: "/dashboard/shipments", icon: Package },
  { name: "Containers", href: "/dashboard/containers", icon: Boxes },
  // { name: "Order History", href: "/history", icon: Clock },
  { name: "Live Tracking", href: "/dashboard/tracking", icon: MapPin },
];

export function Sidebar({
  className,
  onClose,
  collapsed = false,
}: {
  className?: string;
  onClose?: () => void;
  collapsed?: boolean;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground transition-all duration-300",
        collapsed ? "w-20" : "w-full",
        className
      )}
    >
      {/* Logo */}
      <div className={cn(
        "flex h-16 shrink-0 items-center border-b border-sidebar-border px-6 transition-all duration-300",
        collapsed && "px-4 justify-center"
      )}>
        <div className="flex items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://www.wetruck.ai/images/logo.png"
            alt="WeTruck"
            className={cn("h-8 w-auto transition-all", collapsed ? "scale-90" : "")}
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn(
        "flex-1 space-y-1 px-4 py-6 mt-4 overflow-y-auto transition-all duration-300",
        collapsed && "px-2"
      )}>
        {navigation.map((item) => {
          // Check if this is an exact match
          const isExactMatch = pathname === item.href;

          // Check if pathname starts with this href (for child routes)
          const isChildRoute = pathname.startsWith(`${item.href}/`);

          // Find if there's a more specific route that also matches
          // (a route with a longer href that starts with this item's href)
          const hasMoreSpecificMatch = navigation.some(
            (otherItem) =>
              otherItem.href !== item.href &&
              otherItem.href.length > item.href.length &&
              otherItem.href.startsWith(item.href) &&
              (pathname.startsWith(`${otherItem.href}/`) || pathname === otherItem.href)
          );

          const isActive = isExactMatch || (isChildRoute && !hasMoreSpecificMatch);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                collapsed && "justify-center px-2"
              )}
              title={collapsed ? item.name : ""}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  collapsed ? "" : "mr-3",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                )}
                aria-hidden="true"
              />
              {!collapsed && (
                <span className="truncate animate-in fade-in duration-300 px-1">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
