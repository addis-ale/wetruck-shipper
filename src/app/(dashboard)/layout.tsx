"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Clock,
  MapPin,
  Menu,
  User,
  Settings,
  LogOut,
  Bell,
  Upload,
  Lock,
  Boxes,
  CheckCircle2,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { Sidebar } from "@/components/layout/sidebar";
import { PasswordResetDialog } from "@/components/profile/password-reset-dialog";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Shipments", href: "/dashboard/shipments", icon: Package },
  { name: "Priced Shipments", href: "/dashboard/shipments/priced", icon: CheckCircle2 },
  { name: "Containers", href: "/dashboard/containers", icon: Boxes },
  { name: "Order History", href: "/history", icon: Clock },
  { name: "Live Tracking", href: "/tracking", icon: MapPin },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const confirmLogout = async () => {
    await logout();
    router.push("/sign-in");
    setShowLogoutDialog(false);
  };

  return (
    <ProtectedRoute>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <div className="flex min-h-screen bg-background flex-col lg:flex-row">
          {/* Mobile sidebar overlay & drawer */}
          <div
            className={cn(
              "fixed inset-0 z-50 lg:hidden transition-all duration-300",
              sidebarOpen ? "visible" : "invisible"
            )}
          >
            <div
              className={cn(
                "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
                sidebarOpen ? "opacity-100" : "opacity-0"
              )}
              onClick={() => setSidebarOpen(false)}
            />
            <div
              className={cn(
                "fixed inset-y-0 left-0 w-[280px] sm:w-80 bg-sidebar shadow-2xl transform transition-transform duration-300 ease-in-out z-50",
                sidebarOpen ? "translate-x-0" : "-translate-x-full"
              )}
            >
              <Sidebar onClose={() => setSidebarOpen(false)} />
            </div>
          </div>

          {/* Static sidebar for desktop */}
          <aside className={cn(
            "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col border-r bg-sidebar transition-all duration-300 z-50",
            isSidebarCollapsed ? "lg:w-20" : "lg:w-72"
          )}>
            <Sidebar collapsed={isSidebarCollapsed} />
          </aside>

          <div className={cn(
            "flex flex-1 flex-col transition-all duration-300",
            isSidebarCollapsed ? "lg:pl-20" : "lg:pl-72"
          )}>
            <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/60 sm:gap-x-6 sm:px-6 lg:px-8">
              <button
                type="button"
                className="-m-2.5 p-2.5 text-foreground lg:hidden hover:bg-accent rounded-full transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-6 w-6" aria-hidden="true" />
                <span className="sr-only">Open sidebar</span>
              </button>

              <button
                type="button"
                className="hidden lg:flex -ml-2 p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-all"
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              >
                {isSidebarCollapsed ? (
                  <PanelLeftOpen className="h-5 w-5" />
                ) : (
                  <PanelLeftClose className="h-5 w-5" />
                )}
                <span className="sr-only">Toggle Sidebar</span>
              </button>

              <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <div className="flex items-center flex-1 min-w-0">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="https://www.wetruck.ai/images/logo.png"
                    alt="WeTruck"
                    className="h-7 w-auto lg:hidden"
                  />
                </div>
                <div className="flex items-center gap-x-3 sm:gap-x-6">
                  <ModeToggle />
                  <button className="relative text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-full hover:bg-accent">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-1 right-1 flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/40 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                    </span>
                    <span className="sr-only">View notifications</span>
                  </button>

                  <div className="h-6 w-px bg-border" aria-hidden="true" />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-x-2 text-sm font-medium hover:text-primary transition-colors outline-none cursor-pointer group p-1 sm:p-1.5 rounded-full sm:rounded-lg hover:bg-accent/50">
                        <div className="h-8 w-8 shrink-0 rounded-full bg-primary flex items-center justify-center text-white font-bold uppercase text-xs shadow-sm ring-2 ring-background group-hover:ring-accent transition-all">
                          {user?.name?.[0] || "S"}
                        </div>
                        <span className="hidden sm:inline-flex items-center gap-1">
                          <span className="max-w-[100px] truncate">
                            {user?.name?.split(" ")[0] || "Shipper"}
                          </span>
                          <Settings className="h-3.5 w-3.5 text-muted-foreground group-hover:rotate-45 transition-transform" />
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-64 p-2 shadow-xl border-border/50"
                    >
                      <DropdownMenuLabel className="font-normal px-2 pb-2">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold leading-none">
                            {user?.name || "Shipper Admin"}
                          </p>
                          <p className="text-xs leading-none text-muted-foreground italic">
                            {user?.email || "admin@shipper.com"}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="-mx-2" />
                      <DropdownMenuItem className="cursor-pointer rounded-md py-2 px-3">
                        <User className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span className="flex-1">My Profile</span>
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase font-bold tracking-wider opacity-60">
                          Admin
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md py-2 px-3"
                        onClick={() => setPasswordDialogOpen(true)}
                      >
                        <Lock className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Change Password</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="cursor-pointer rounded-md py-2 px-3"
                        onClick={() => router.push("/dashboard/organazation/documents")}
                      >
                        <Upload className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Upload Document</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="cursor-pointer rounded-md py-2 px-3">
                        <Settings className="mr-3 h-4 w-4 text-muted-foreground" />
                        <span>Account Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="-mx-2" />
                      <DropdownMenuItem
                        onClick={handleLogoutClick}
                        className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer rounded-md py-2 px-3 font-medium"
                      >
                        <LogOut className="mr-3 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </header>

            <Dialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Confirm Sign out</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to sign out of the WeTruck Shipper
                    Portal?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setShowLogoutDialog(false)}
                  >
                    Stay Logged In
                  </Button>
                  <Button variant="destructive" onClick={confirmLogout}>
                    Sign Out
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <PasswordResetDialog
              open={passwordDialogOpen}
              onOpenChange={setPasswordDialogOpen}
            />

            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 mb-20 lg:mb-0 bg-background/50">
              <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                {children}
              </div>
            </main>

            {/* Mobile Bottom Navigation - Enhanced for Mobile First */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 border-t border-border backdrop-blur-xl lg:hidden safe-area-bottom shadow-[0_-8px_30px_rgb(0,0,0,0.04)]">
              <div className="flex justify-around items-center h-18 px-2 max-w-md mx-auto">
                {navigation.map((item) => {
                  // Check if this is an exact match
                  const isExactMatch = pathname === item.href;

                  // Check if pathname starts with this href (for child routes)
                  const isChildRoute = pathname.startsWith(`${item.href}/`);

                  // Find if there's a more specific route that also matches
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
                      className={cn(
                        "flex flex-col items-center justify-center flex-1 h-full gap-1 transition-all relative",
                        isActive
                          ? "text-primary scale-110"
                          : "text-muted-foreground hover:text-foreground opacity-60"
                      )}
                    >
                      {isActive && (
                        <span className="absolute -top-px left-1/2 -translate-x-1/2 w-10 h-1 bg-primary rounded-full animate-in fade-in slide-in-from-top-1 duration-300" />
                      )}
                      <item.icon
                        className={cn(
                          "h-6 w-6",
                          isActive ? "stroke-[2.5px]" : "stroke-[2px]"
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold leading-none tracking-tight transition-all",
                          isActive ? "opacity-100" : "opacity-0 invisible h-0"
                        )}
                      >
                        {item.name.split(" ")[0]}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </nav>
          </div>
        </div>
      </ThemeProvider>
    </ProtectedRoute>
  );
}
