"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Navigation,
  CircleDot,
  Circle,
  Container as ContainerIcon,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTrackShipment } from "@/app/modules/shipment/server/hooks/use-track-shipment";
import { useShipment } from "@/app/modules/shipment/server/hooks/use-shipment";
import { ShipmentTrackingMap } from "../components/shipment-tracking-map";

interface ShipmentTrackingViewProps {
  shipId: number;
}

/* ── Status definitions ─────────────────────────────────────────────────── */

const STATUS_STEPS = [
  { key: "created", label: "Created", icon: Package },
  { key: "price_requested", label: "Price Requested", icon: Clock },
  { key: "priced", label: "Priced", icon: CircleDot },
  { key: "accepted_by_shipper", label: "Accepted", icon: CheckCircle2 },
  { key: "allocated", label: "Allocated", icon: Truck },
  { key: "ready_for_pickup", label: "Ready for Pickup", icon: Navigation },
  { key: "in_transit", label: "In Transit", icon: Truck },
  { key: "delivered", label: "Delivered", icon: MapPin },
  { key: "completed", label: "Completed", icon: CheckCircle2 },
] as const;

function getStatusIndex(status: string): number {
  return STATUS_STEPS.findIndex((s) => s.key === status);
}

const getStatusBadgeVariant = (status: string) => {
  const s = status.toLowerCase();
  if (s.includes("completed") || s.includes("delivered"))
    return "default" as const;
  if (s.includes("accepted") || s.includes("allocated"))
    return "default" as const;
  return "secondary" as const;
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

function formatLocation(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatDateShort(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

/* ── Types for the actual API response ──────────────────────────────────── */

interface TrackingContainer {
  container_number: string;
  container_size: string;
  container_type: string;
  is_returning?: boolean;
  return_location_info?: {
    country?: string;
    city?: string;
    port?: string;
    address?: string;
  };
}

interface TrackingShipItem {
  transporter_name: string | null;
  containers: TrackingContainer[];
  origin: string | null;
  destination: string | null;
  pickup_date: string | null;
  delivery_date: string | null;
  status: string;
}

interface LocationLog {
  latitude?: number;
  longitude?: number;
  timestamp?: string;
  speed?: number;
  direction?: number;
}

interface TrackingItem {
  truck_id: number;
  ship_item: TrackingShipItem;
  location_log: LocationLog[];
  count_location_log: number;
}

/* ── Component ─────────────────────────────────────────────────────────── */

export function ShipmentTrackingView({ shipId }: ShipmentTrackingViewProps) {
  const isMobile = useIsMobile();

  // Fetch the shipment details for origin, destination, status, dates, tracking_number
  const {
    data: shipment,
    isLoading: shipmentLoading,
    error: shipmentError,
  } = useShipment(shipId);

  // Fetch the tracking data (truck assignments, location logs)
  const {
    data: trackingData,
    isLoading: trackingLoading,
    error: trackingError,
  } = useTrackShipment(shipId);

  // Parse tracking items from the API response
  const trackingItems: TrackingItem[] = useMemo(() => {
    if (!trackingData) return [];
    // Response shape: { status, result: [...] }
    if ("result" in trackingData && Array.isArray(trackingData.result)) {
      return trackingData.result as TrackingItem[];
    }
    if (Array.isArray(trackingData)) {
      return trackingData as TrackingItem[];
    }
    return [];
  }, [trackingData]);

  const isLoading = shipmentLoading || trackingLoading;

  // Container size label
  const containerSizeLabel = (size: string) =>
    size === "forty_feet" ? "40ft" : size === "twenty_feet" ? "20ft" : size;

  /* ── Loading ─────────────────────────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────────────── */
  if (shipmentError || !shipment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive text-lg font-medium mb-2">
              Failed to load shipment information
            </p>
            <p className="text-muted-foreground mb-4">
              {shipmentError?.message ||
                "The shipment data could not be retrieved."}
            </p>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/shipments/placeholder?id=${shipId}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Shipment
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  /* ── Data from shipment (always available) ────────────────────────────── */
  const status = shipment.status ?? "created";
  const trackingNumber = shipment.tracking_number;
  const origin = shipment.origin ?? "";
  const destination = shipment.destination ?? "";
  const pickupDate = shipment.pickup_date ?? "";
  const deliveryDate = shipment.delivery_date ?? "";
  const currentStepIdx = getStatusIndex(status);

  // Total containers across all tracked truck assignments
  const totalTrackedContainers = trackingItems.reduce(
    (acc, item) => acc + (item.ship_item?.containers?.length ?? 0),
    0,
  );
  const totalLocationLogs = trackingItems.reduce(
    (acc, item) => acc + (item.count_location_log ?? 0),
    0,
  );

  /* ── Mobile Layout ───────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div className="space-y-4 pb-6">
        {/* Header */}
        <header className="flex items-center justify-between gap-2">
          <Link
            href={`/dashboard/shipments/placeholder?id=${shipId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Shipment
          </Link>
        </header>

        {/* Tracking info card */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-l-4 border-l-primary bg-primary/5 px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Navigation className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground truncate">
                Track Shipment
              </span>
            </div>
            <Badge
              variant={getStatusBadgeVariant(status)}
              className="shrink-0 text-[10px] uppercase font-medium"
            >
              {status.replace(/_/g, " ")}
            </Badge>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Tracking #</span>
              <span className="text-sm font-mono font-semibold text-primary">
                {trackingNumber ?? "N/A"}
              </span>
            </div>

            {/* Route */}
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Origin
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {origin ? formatLocation(origin) : "—"}
                  </p>
                  {pickupDate && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateShort(pickupDate)}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-5 w-5 text-primary shrink-0" />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Destination
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {destination ? formatLocation(destination) : "—"}
                  </p>
                  {deliveryDate && (
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDateShort(deliveryDate)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map View */}
        {trackingItems.length > 0 && (
          <div className="h-[300px] w-full mt-4">
            <ShipmentTrackingMap items={trackingItems} />
          </div>
        )}

        {/* Status Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Clock className="h-4 w-4 text-primary" />
              </div>
              Status Timeline
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pt-0">
            <div className="relative pl-6">
              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx <= currentStepIdx;
                const isCurrent = idx === currentStepIdx;
                const StepIcon = step.icon;

                return (
                  <div key={step.key} className="relative pb-6 last:pb-0">
                    {idx < STATUS_STEPS.length - 1 && (
                      <div
                        className={`absolute left-[-14px] top-7 w-0.5 h-[calc(100%-14px)] ${
                          idx < currentStepIdx ? "bg-primary" : "bg-border"
                        }`}
                      />
                    )}
                    <div
                      className={`absolute left-[-20px] top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                        isCurrent
                          ? "border-primary bg-primary text-primary-foreground"
                          : isCompleted
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground"
                      }`}
                    >
                      {isCurrent ? (
                        <CircleDot className="h-3 w-3" />
                      ) : isCompleted ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : (
                        <Circle className="h-3 w-3" />
                      )}
                    </div>
                    <div
                      className={`${
                        isCurrent
                          ? "opacity-100"
                          : isCompleted
                          ? "opacity-80"
                          : "opacity-40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <StepIcon
                          className={`h-4 w-4 ${
                            isCompleted
                              ? "text-primary"
                              : "text-muted-foreground"
                          }`}
                        />
                        <p
                          className={`text-sm font-medium ${
                            isCurrent
                              ? "text-foreground font-semibold"
                              : "text-foreground"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Truck Assignments */}
        {trackingItems.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                  <Truck className="h-4 w-4 text-blue-500" />
                </div>
                Assigned Trucks ({trackingItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pt-0">
              {trackingItems.map((item) => (
                <div
                  key={item.truck_id}
                  className="rounded-xl border bg-card p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                        <Truck className="h-3.5 w-3.5 text-blue-500" />
                      </div>
                      <span className="text-sm font-semibold text-foreground">
                        Truck #{item.truck_id}
                      </span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.count_location_log} GPS points
                    </Badge>
                  </div>
                  {item.ship_item?.transporter_name && (
                    <p className="text-xs text-muted-foreground mb-2">
                      Transporter: {item.ship_item.transporter_name}
                    </p>
                  )}
                  {item.ship_item?.containers?.length > 0 && (
                    <div className="space-y-1.5">
                      {item.ship_item.containers.map((c, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 rounded-lg bg-muted/40 px-2 py-2"
                        >
                          <ContainerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="text-xs font-mono font-medium text-foreground truncate">
                            {c.container_number}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {containerSizeLabel(c.container_size)} /{" "}
                            {c.container_type}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Tracking error (non-blocking) */}
        {trackingError && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {trackingError.message ||
                  "Tracking data is not available yet for this shipment."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  /* ── Desktop Layout ──────────────────────────────────────────────────── */
  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/shipments/placeholder?id=${shipId}`}>
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Track Shipment
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {trackingNumber ? (
                <>
                  Tracking:{" "}
                  <span className="font-mono font-semibold text-primary">
                    {trackingNumber}
                  </span>
                </>
              ) : (
                "Real-time shipment tracking"
              )}
            </p>
          </div>
        </div>
        <Badge
          variant={getStatusBadgeVariant(status)}
          className="text-sm uppercase font-medium px-3 py-1"
        >
          {status.replace(/_/g, " ")}
        </Badge>
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Route card */}
        <Card className="md:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Origin
                </p>
                <p className="text-lg font-bold text-foreground">
                  {origin ? formatLocation(origin) : "—"}
                </p>
                {pickupDate && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(pickupDate)}
                  </p>
                )}
              </div>
              <div className="flex flex-col items-center gap-1">
                <div className="h-0.5 w-12 bg-primary/30 rounded" />
                <Truck className="h-5 w-5 text-primary" />
                <div className="h-0.5 w-12 bg-primary/30 rounded" />
              </div>
              <div className="flex-1 text-right">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Destination
                </p>
                <p className="text-lg font-bold text-foreground">
                  {destination ? formatLocation(destination) : "—"}
                </p>
                {deliveryDate && (
                  <p className="text-sm text-muted-foreground flex items-center justify-end gap-1 mt-1">
                    <Calendar className="h-3.5 w-3.5" />
                    {formatDate(deliveryDate)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick info card */}
        <Card>
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Package className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Shipment ID</p>
                <p className="text-sm font-semibold text-foreground">
                  #{shipId}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
                <Truck className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Trucks Assigned</p>
                <p className="text-sm font-semibold text-foreground">
                  {trackingItems.length}
                </p>
              </div>
            </div>
            {totalTrackedContainers > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                  <ContainerIcon className="h-4 w-4 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Containers</p>
                  <p className="text-sm font-semibold text-foreground">
                    {totalTrackedContainers}
                  </p>
                </div>
              </div>
            )}
            {totalLocationLogs > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/10">
                  <MapPin className="h-4 w-4 text-violet-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">GPS Points</p>
                  <p className="text-sm font-semibold text-foreground">
                    {totalLocationLogs}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Map View */}
      {trackingItems.length > 0 && (
        <div className="h-[500px] w-full">
          <ShipmentTrackingMap items={trackingItems} />
        </div>
      )}

      {/* Status Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Status Timeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Horizontal stepper */}
          <div className="flex items-start gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {STATUS_STEPS.map((step, idx) => {
              const isCompleted = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.key}
                  className="flex flex-col items-center flex-1 min-w-[60px] sm:min-w-[72px] relative"
                >
                  {idx > 0 && (
                    <div
                      className={`absolute top-4 right-1/2 w-full h-0.5 -translate-y-1/2 ${
                        idx <= currentStepIdx ? "bg-primary" : "bg-border"
                      }`}
                      style={{ left: "-50%" }}
                    />
                  )}

                  <div
                    className={`relative z-10 flex h-6 w-6 sm:h-8 sm:w-8 items-center justify-center rounded-full border-2 transition-all ${
                      isCurrent
                        ? "border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/25 scale-110"
                        : isCompleted
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                  </div>

                  <p
                    className={`text-[9px] sm:text-[11px] text-center mt-1.5 sm:mt-2 leading-tight ${
                      isCurrent
                        ? "font-bold text-foreground"
                        : isCompleted
                        ? "font-medium text-foreground/80"
                        : "font-normal text-muted-foreground"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Truck Assignments */}
      {trackingItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-blue-500" />
              Assigned Trucks ({trackingItems.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {trackingItems.map((item) => (
                <div
                  key={item.truck_id}
                  className="rounded-xl border bg-card p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
                        <Truck className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Truck #{item.truck_id}
                        </p>
                        {item.ship_item?.transporter_name && (
                          <p className="text-xs text-muted-foreground">
                            {item.ship_item.transporter_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-xs">
                        {item.count_location_log} GPS points
                      </Badge>
                    </div>
                  </div>

                  {/* Containers */}
                  {item.ship_item?.containers?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Containers ({item.ship_item.containers.length})
                      </p>
                      <div className="space-y-1.5">
                        {item.ship_item.containers.map((c, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 px-2 sm:px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <ContainerIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="text-xs sm:text-sm font-mono font-medium text-foreground truncate">
                                {c.container_number}
                              </span>
                            </div>
                            <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0">
                              {containerSizeLabel(c.container_size)} /{" "}
                              {c.container_type}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tracking data not available warning */}
      {trackingError && (
        <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/50">
                <Navigation className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Tracking data not available yet
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-300 mt-0.5">
                  {trackingError.message ||
                    "Live tracking will be available once the shipment is accepted and trucks are assigned."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No tracking items and no error: show info */}
      {!trackingError && trackingItems.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-muted/50 p-4 mb-4">
                <Truck className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                No trucks assigned yet
              </h3>
              <p className="text-muted-foreground max-w-sm text-sm">
                Truck assignments and live GPS tracking will appear here once
                the shipment is accepted and trucks are dispatched.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
