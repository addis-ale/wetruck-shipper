"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
} from "lucide-react";
import { useShipments } from "@/app/modules/shipment/server/hooks/use-shipments";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import { useAuth } from "@/components/providers/AuthProvider";
import type { Shipment } from "@/app/modules/shipment/server/types/shipment.types";

function formatLocation(location: string) {
  return location
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "N/A";
  }
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function getStatusVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "in_transit":
    case "allocated":
    case "ready_for_pickup":
      return "default";
    case "price_requested":
      return "secondary";
    case "priced":
      return "secondary"; // styled via className override for light-red
    case "delivered":
    case "completed":
      return "outline";
    case "rejected_by_shipper":
      return "destructive";
    default:
      return "secondary";
  }
}

const ITEMS_PER_PAGE = 5;

export default function ShipperDashboard() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipments({
    per_page: 100,
  });
  const { data: containersData } = useContainers({ per_page: 500 });

  const shipments = useMemo(() => shipmentsData?.items ?? [], [shipmentsData]);
  const containerCounts = useMemo(() => {
    const counts = new Map<number, number>();
    (containersData?.items ?? []).forEach((c) => {
      if (c.ship_id) {
        counts.set(c.ship_id, (counts.get(c.ship_id) ?? 0) + 1);
      }
    });
    return counts;
  }, [containersData?.items]);

  const stats = useMemo(() => {
    const active = shipments.filter((s) =>
      ["in_transit", "allocated", "ready_for_pickup"].includes(s.status ?? ""),
    ).length;
    const pendingQuotes = shipments.filter((s) =>
      ["price_requested", "priced"].includes(s.status ?? ""),
    ).length;
    const completed = shipments.filter((s) =>
      ["delivered", "completed"].includes(s.status ?? ""),
    ).length;
    const drafts = shipments.filter((s) => s.status === "created").length;
    return [
      {
        title: "Active Shipments",
        value: String(active),
        icon: Truck,
        description: "In transit or ready for pickup",
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
      {
        title: "Pending Quotes",
        value: String(pendingQuotes),
        icon: Clock,
        description: "Awaiting price or your acceptance",
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
      {
        title: "Completed",
        value: String(completed),
        icon: CheckCircle2,
        description: "Successfully delivered",
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
      {
        title: "Drafts",
        value: String(drafts),
        icon: Package,
        description: "Incomplete order requests",
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
    ];
  }, [shipments]);

  const sortedShipments = useMemo(() => {
    return [...shipments]
      .sort((a, b) => {
        const dateA = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
        const dateB = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
        return dateA - dateB;
      });
  }, [shipments]);

  const totalPages = Math.max(1, Math.ceil(sortedShipments.length / ITEMS_PER_PAGE));
  const recentShipments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedShipments.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedShipments, currentPage]);

  const actionRequired = useMemo(() => {
    const priced = shipments.filter((s) => s.status === "priced");
    const priceRequested = shipments.filter(
      (s) => s.status === "price_requested",
    );
    return [
      ...priced.map((s) => ({
        shipment: s,
        type: "review" as const,
        title: `Review quotes for shipment #${s.id}`,
        description: "Price is ready. Accept or reject the quote to proceed.",
        href: `/dashboard/shipments/priced/${s.id}`,
      })),
      ...priceRequested.map((s) => ({
        shipment: s,
        type: "waiting" as const,
        title: `Price requested for shipment #${s.id}`,
        description: "Waiting for transporters to submit their quotes.",
        href: "/dashboard/shipments",
      })),
    ].slice(0, 3);
  }, [shipments]);

  if (shipmentsLoading) {
    return (
      <div className="space-y-6 sm:space-y-8">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
          <Skeleton className="lg:col-span-4 h-80 rounded-lg" />
          <Skeleton className="lg:col-span-3 h-80 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here&apos;s an overview of your shipments and activity.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 xs:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="overflow-hidden transition-all hover:shadow-md border-border/60 relative bg-gradient-to-br from-white to-green-50 dark:from-green-950/40 dark:to-green-900/30 dark:border-green-900/50"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("h-4 w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold tracking-tight">
                {stat.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-7">
        {/* Recent Shipments */}
        <Card className="lg:col-span-4 border-border/60 shadow-sm overflow-hidden min-w-0">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Shipments</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="/dashboard/shipments"
                className="text-primary font-medium flex items-center gap-1"
              >
                View All
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {recentShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium">No shipments yet</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Create your first shipment to get started
                </p>
                <Button asChild>
                  <Link href="/dashboard/shipments" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Create Shipment
                  </Link>
                </Button>
              </div>
            ) : (
              <>
                <div className="hidden sm:block overflow-x-hidden min-w-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-border/50">
                        <TableHead className="font-medium">ID</TableHead>
                        <TableHead className="font-medium">Route</TableHead>
                        <TableHead className="font-medium">Date</TableHead>
                        <TableHead className="font-medium">
                          Containers
                        </TableHead>
                        <TableHead className="font-medium">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {recentShipments.map((shipment) => (
                        <ShipmentRow
                          key={shipment.id}
                          shipment={shipment}
                          containerCount={containerCounts.get(shipment.id) ?? 0}
                        />
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="divide-y divide-border/40 sm:hidden">
                  {recentShipments.map((shipment) => (
                    <ShipmentMobileRow
                      key={shipment.id}
                      shipment={shipment}
                      containerCount={containerCounts.get(shipment.id) ?? 0}
                    />
                  ))}
                </div>
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-border/40">
                    <span className="text-xs text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage <= 1}
                      >
                        <ChevronLeft className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage >= totalPages}
                      >
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="lg:col-span-3 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>Action Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionRequired.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-lg border border-dashed border-border/60">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/60 mb-3" />
                <p className="text-sm font-medium">All caught up</p>
                <p className="text-xs text-muted-foreground mt-1">
                  No actions required at the moment
                </p>
              </div>
            ) : (
              actionRequired.map((item) => (
                <Link
                  key={item.shipment.id}
                  href={item.href}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-background p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group"
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg shrink-0",
                      item.type === "review"
                        ? "bg-primary/10 group-hover:bg-primary/15"
                        : "bg-blue-500/10 group-hover:bg-blue-500/15",
                    )}
                  >
                    <AlertCircle
                      className={cn(
                        "h-5 w-5",
                        item.type === "review"
                          ? "text-primary"
                          : "text-blue-600",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </Link>
              ))
            )}
            {actionRequired.length > 0 && (
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link href="/dashboard/shipments/priced">
                  View All Notifications
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShipmentRow({
  shipment,
  containerCount,
}: {
  shipment: Shipment;
  containerCount: number;
}) {
  const status = shipment.status ?? "created";
  const href =
    status === "priced"
      ? `/dashboard/shipments/priced/${shipment.id}`
      : status === "accepted_by_shipper"
        ? `/dashboard/shipments/accepted/${shipment.id}`
        : `/dashboard/shipments/${shipment.id}`;

  return (
    <TableRow className="cursor-pointer transition-colors border-border/40 group">
      <TableCell className="font-medium">
        <Link
          href={href}
          className="text-primary hover:underline flex items-center gap-1"
        >
          #{shipment.id}
          <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatLocation(shipment.origin)} →{" "}
        {formatLocation(shipment.destination)}
      </TableCell>
      <TableCell className="text-muted-foreground">
        {formatDate(shipment.pickup_date)}
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center gap-1 font-medium">
          <Package className="h-3 w-3 text-muted-foreground" />
          {containerCount}
        </span>
      </TableCell>
      <TableCell>
        <Badge
          variant={getStatusVariant(status)}
          className={cn(
            "font-medium capitalize",
            status === "priced" && "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
          )}
        >
          {getStatusLabel(status)}
        </Badge>
      </TableCell>
    </TableRow>
  );
}

function ShipmentMobileRow({
  shipment,
  containerCount,
}: {
  shipment: Shipment;
  containerCount: number;
}) {
  const status = shipment.status ?? "created";
  const href =
    status === "priced"
      ? `/dashboard/shipments/priced/${shipment.id}`
      : status === "accepted_by_shipper"
        ? `/dashboard/shipments/accepted/${shipment.id}`
        : `/dashboard/shipments/${shipment.id}`;

  return (
    <Link href={href}>
      <div className="p-4 space-y-3 active:bg-accent/50 transition-colors">
        <div className="flex justify-between items-start">
          <span className="font-medium text-primary">#{shipment.id}</span>
          <Badge
            variant={getStatusVariant(status)}
            className={cn(
              "font-medium text-xs capitalize",
              status === "priced" && "bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
            )}
          >
            {getStatusLabel(status)}
          </Badge>
        </div>
        <div className="flex justify-between items-end">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">
              {formatLocation(shipment.origin)} →{" "}
              {formatLocation(shipment.destination)}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatDate(shipment.pickup_date)}
            </p>
          </div>
          <span className="text-xs font-medium bg-muted px-2 py-1 rounded-md flex items-center gap-1">
            <Package className="h-3 w-3" />
            {containerCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
