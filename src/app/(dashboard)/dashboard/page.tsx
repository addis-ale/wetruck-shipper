"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  ChevronRight,
  Plus,
  FileText,
} from "lucide-react";
import { useShipments } from "@/app/modules/shipment/server/hooks/use-shipments";
import { useAuth } from "@/components/providers/AuthProvider";
import { formatDate } from "@/lib/format";
import type { Shipment } from "@/app/modules/shipment/server/types/shipment.types";

function formatLocation(location: string) {
  return location
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getStatusLabel(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

export default function ShipperDashboard() {
  const { t } = useTranslation(["dashboard", "common"]);
  const { user } = useAuth();
  const { data: shipmentsData, isLoading: shipmentsLoading } = useShipments({
    per_page: 100,
  });

  const shipments = useMemo(() => shipmentsData?.items ?? [], [shipmentsData]);

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
        title: t("dashboard:stats.active_shipments"),
        value: String(active),
        icon: Truck,
        description: t("dashboard:stats.active_description"),
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
      {
        title: t("dashboard:stats.pending_quotes"),
        value: String(pendingQuotes),
        icon: Clock,
        description: t("dashboard:stats.pending_description"),
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
      {
        title: t("dashboard:stats.completed"),
        value: String(completed),
        icon: CheckCircle2,
        description: t("dashboard:stats.completed_description"),
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
      {
        title: t("dashboard:stats.drafts"),
        value: String(drafts),
        icon: Package,
        description: t("dashboard:stats.drafts_description"),
        color: "text-green-800 dark:text-green-300",
        bgColor: "bg-green-100 dark:bg-green-900/50",
      },
    ];
  }, [shipments, t]);

  const recentShipments = useMemo(() => {
    return [...shipments]
      .sort((a, b) => {
        const dateA = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
        const dateB = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
        return dateA - dateB;
      })
      .slice(0, 3);
  }, [shipments]);

  // Action required: only priced shipments (shipper must accept/reject the quote)
  const actionRequired = useMemo(() => {
    return shipments
      .filter((s) => s.status === "priced")
      .map((s) => ({
        shipment: s,
        title: t("dashboard:price_requested_for", { id: s.id }),
        description: t("dashboard:review_quotes"),
        href: `/dashboard/shipments/priced/placeholder?shipId=${s.id}`,
      }));
  }, [shipments, t]);

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
          {t("dashboard:welcome")}{user?.name ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("dashboard:overview")}
        </p>
      </div>

      {/* Stats cards - horizontal scroll on mobile (scrollbar hidden), grid on desktop */}
      <div className="flex gap-3 overflow-x-auto overflow-y-hidden pb-2 sm:overflow-visible sm:pb-0 snap-x snap-mandatory lg:grid lg:grid-cols-4 lg:gap-4 scrollbar-hide">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="min-w-[calc(50%-0.375rem)] xs:min-w-[140px] sm:min-w-0 shrink-0 snap-start overflow-hidden transition-all hover:shadow-md border-border/60 lg:shrink"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={cn("p-1.5 rounded-md", stat.bgColor)}>
                <stat.icon className={cn("h-3.5 w-3.5", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-bold tracking-tight">
                {stat.value}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">
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
            <CardTitle>{t("dashboard:recent_shipments")}</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="/dashboard/shipments"
                className="text-primary font-medium flex items-center gap-1"
              >
                {t("common:buttons.view_all")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0 sm:p-6 sm:pt-0">
            {recentShipments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm font-medium">{t("dashboard:no_shipments")}</p>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  {t("dashboard:create_first")}
                </p>
                <Button asChild>
                  <Link href="/dashboard/shipments" className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t("dashboard:create_shipment")}
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {recentShipments.map((shipment) => (
                  <ShipmentCard
                    key={shipment.id}
                    shipment={shipment}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Required */}
        <Card className="lg:col-span-3 border-border/60 shadow-sm">
          <CardHeader>
            <CardTitle>{t("dashboard:action_required")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionRequired.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-lg border border-dashed border-border/60">
                <CheckCircle2 className="h-10 w-10 text-emerald-500/60 mb-3" />
                <p className="text-sm font-medium">{t("dashboard:all_caught_up")}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t("dashboard:no_actions")}
                </p>
              </div>
            ) : (
              actionRequired.map((item) => (
                <Link
                  key={item.shipment.id}
                  href={item.href}
                  className="flex items-start gap-4 rounded-xl border border-border/50 bg-background p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group border-l-4 border-l-primary"
                >
                  <div className="p-2 rounded-lg shrink-0 bg-primary/10 group-hover:bg-primary/15">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.description}
                    </p>
                    <span className="inline-block mt-2 text-primary font-semibold text-xs uppercase tracking-wide group-hover:underline">
                      {t("dashboard:review_now")}
                    </span>
                  </div>
                </Link>
              ))
            )}
            {actionRequired.length > 0 && (
              <Button variant="outline" className="w-full mt-2" asChild>
                <Link href="/dashboard/shipments/priced">
                  {t("dashboard:view_all_priced")}
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ShipmentCard({
  shipment,
}: {
  shipment: Shipment;
}) {
  const status = shipment.status ?? "created";
  const href =
    status === "priced"
      ? `/dashboard/shipments/priced/placeholder?shipId=${shipment.id}`
      : status === "accepted_by_shipper"
        ? `/dashboard/shipments/accepted/placeholder?shipId=${shipment.id}`
        : `/dashboard/shipments/placeholder?id=${shipment.id}`;

  return (
    <Link href={href}>
      <div className="flex items-stretch gap-4 rounded-xl border border-border/50 bg-background p-4 shadow-sm transition-all hover:border-primary/30 hover:shadow-md group">
        {/* Top row: #ID + date (left) | Status pill + arrow (right) */}
        <div className="flex flex-1 min-w-0 flex-col">
          <div className="flex justify-between items-start gap-2">
            <span className="text-sm font-medium text-foreground">
              #{shipment.id} {formatDate(shipment.pickup_date)}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Badge
                variant="outline"
                className="font-semibold text-[10px] uppercase tracking-wide bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
              >
                {getStatusLabel(status)}
              </Badge>
              <ChevronRight className="h-4 w-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
          {/* Origin → Destination with vertical dashed line and green dots */}
          <div className="flex gap-2 mt-3">
            <div className="flex flex-col items-center shrink-0 pt-0.5">
              <span
                className="h-2 w-2 rounded-full bg-primary shrink-0"
                aria-hidden
              />
              <div
                className="w-px h-3 border-l border-dashed border-primary/50 my-0.5"
                aria-hidden
              />
              <span
                className="h-2 w-2 rounded-full bg-primary shrink-0"
                aria-hidden
              />
            </div>
            <div className="flex flex-col justify-center gap-0.5 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {formatLocation(shipment.origin)}
              </p>
              <p className="text-sm font-medium text-foreground truncate">
                {formatLocation(shipment.destination)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
