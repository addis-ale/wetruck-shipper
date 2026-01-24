"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PlusCircle,
  Package,
  Clock,
  MapPin,
  Boxes,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Shipments", href: "/dashboard/shipments", icon: Package },
  { name: "Containers", href: "/dashboard/containers", icon: Boxes },
  { name: "Order History", href: "/history", icon: Clock },
  { name: "Live Tracking", href: "/dashboard/tracking", icon: MapPin },
];

export function Sidebar({
  className,
  onClose,
}: {
  className?: string;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 shrink-0 items-center border-b border-sidebar-border px-6">
        <div className="flex items-center">
          <img
            src="https://www.wetruck.ai/images/logo.png"
            alt="WeTruck"
            className="h-8 w-auto"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4 py-6 mt-4 overflow-y-auto">
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
                "group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "mr-3 h-5 w-5 shrink-0 transition-colors",
                  isActive
                    ? "text-sidebar-primary"
                    : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground"
                )}
                aria-hidden="true"
              />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
