"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Trash2,
  Edit,
  ArrowLeft,
  Loader2,
  MapPin,
  Calendar,
  Package,
  Building2,
  FileText,
  Mail,
  Phone,
  Truck,
  Navigation,
  Clock,
  CheckCircle2,
  ChevronRight,
  CheckCircle2 as CheckCircle,
  X,
  Container as ContainerIcon,
  ArrowRight,
  Plus,
  AlertTriangle,
} from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useShipment } from "@/app/modules/shipment/server/hooks/use-shipment";
import { useDeleteShipment } from "@/app/modules/shipment/server/hooks/use-delete-shipment";
import { UpdateShipmentForm } from "@/app/modules/shipment/ui/components/update-shipment-form";
import { UpdateShipmentDrawer } from "@/app/modules/shipment/ui/components/update-shipment-drawer";
import { ContainerAssignTable } from "@/app/modules/shipment/ui/components/container-assign-table";
import { useContainerAssignColumns } from "@/app/modules/shipment/ui/components/container-assign-columns";
import { useAssignContainers } from "@/app/modules/shipment/server/hooks/use-assign-container";
import { useRemoveContainer } from "@/app/modules/shipment/server/hooks/use-remove-container";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import { ViewContainersSheet } from "@/app/modules/container/ui/components/view-containers-sheet";
import { useGetPrice } from "@/app/modules/shipment/server/hooks/use-get-price";
import { useRequestPrice } from "@/app/modules/shipment/server/hooks/use-request-price";
import { useShipperShipItems } from "@/app/modules/shipment/server/hooks/use-transporter-shipments";
import { useAcceptShip } from "@/app/modules/shipment/server/hooks/use-accept-ship";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { ShipmentDocumentsCard } from "../components/shipment-documents/shipment-documents-card";
import type { Container } from "@/app/modules/container/server/types/container.types";
import type { ShipperShipItemsItem, ShipItem } from "@/lib/zod/shipment.schema";
import { useTranslation } from "react-i18next";
import { formatDateShort, formatDateLong } from "@/lib/format";

interface ShipmentDetailViewProps {
  shipmentId: number;
}

function formatLocation(s: string) {
  return s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Helper function to get status badge variant
const getStatusVariant = (status: string) => {
  const statusLower = status.toLowerCase();
  if (statusLower.includes("completed") || statusLower.includes("delivered")) {
    return "success";
  }
  if (statusLower.includes("rejected")) {
    return "destructive";
  }
  if (statusLower.includes("accepted") || statusLower.includes("allocated")) {
    return "default";
  }
  if (statusLower.includes("in_transit") || statusLower.includes("ready")) {
    return "warning";
  }
  if (
    statusLower.includes("price_requested") ||
    statusLower.includes("priced")
  ) {
    return "default";
  }
  return "secondary";
};

export function ShipmentDetailView({ shipmentId }: ShipmentDetailViewProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { t } = useTranslation(["shipment", "common"]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [dismissedAlerts, setDismissedAlerts] = useState<
    Record<number, boolean>
  >({});
  const [assignSheetOpen, setAssignSheetOpen] = useState(false);
  const [showUpdateDrawer, setShowUpdateDrawer] = useState(false);
  const [removeConfirmContainerId, setRemoveConfirmContainerId] = useState<
    number | null
  >(null);

  // Priced shipment: transporter quote selection
  const [selectedTransporterIds, setSelectedTransporterIds] = useState<
    Set<number>
  >(new Set());
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [containersSheetGroup, setContainersSheetGroup] =
    useState<ShipperShipItemsItem | null>(null);

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("dismissedPriceRequestAlerts");
    if (stored) {
      try {
        setDismissedAlerts(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse dismissed alerts:", e);
      }
    }
  }, []);

  const { data: shipment, isLoading, error } = useShipment(shipmentId);
  const { mutate: deleteShipment, isPending: isDeleting } = useDeleteShipment();
  const { mutate: assignContainers } = useAssignContainers();
  const { mutate: removeContainer } = useRemoveContainer();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for Get price action
  const { mutate: getPrice } = useGetPrice();
  const { mutate: requestPrice, isPending: isRequestingPrice, error: priceRequestError, reset: resetPriceRequestError } =
    useRequestPrice();

  // Priced shipment: fetch transporter quotes
  const { data: shipItemsData, isLoading: isLoadingQuotes } =
    useShipperShipItems(
      shipment?.status === "priced" ? { ship_id: shipmentId } : undefined,
    );
  const { mutate: acceptShip, isPending: isAccepting } = useAcceptShip();

  const transporterGroups: ShipperShipItemsItem[] = shipItemsData?.items ?? [];

  const handleToggleTransporter = (transporterId: number) => {
    setSelectedTransporterIds((prev) => {
      const next = new Set(prev);
      if (next.has(transporterId)) {
        next.delete(transporterId);
      } else {
        next.add(transporterId);
      }
      return next;
    });
  };

  const handleToggleAllTransporters = () => {
    if (selectedTransporterIds.size === transporterGroups.length) {
      setSelectedTransporterIds(new Set());
    } else {
      setSelectedTransporterIds(
        new Set(transporterGroups.map((g) => g.transporter_id)),
      );
    }
  };

  const confirmAcceptQuotes = () => {
    if (selectedTransporterIds.size === 0) return;
    const shipItemIds: number[] = [];
    transporterGroups.forEach((group) => {
      if (selectedTransporterIds.has(group.transporter_id)) {
        group.ship_items.forEach((item: ShipItem) => {
          shipItemIds.push(item.id);
        });
      }
    });

    setAcceptDialogOpen(false);
    const backup = new Set(selectedTransporterIds);
    setSelectedTransporterIds(new Set());

    acceptShip(
      { shipId: shipmentId, shipItemIds },
      {
        onError: () => {
          setAcceptDialogOpen(true);
          setSelectedTransporterIds(backup);
        },
      },
    );
  };

  // Determine if alert should be shown (after shipment is loaded)
  const shouldShowPriceRequestAlert =
    shipment?.status === "price_requested" && !dismissedAlerts[shipmentId];

  const handleDismissAlert = () => {
    const updated = { ...dismissedAlerts, [shipmentId]: true };
    setDismissedAlerts(updated);
    localStorage.setItem(
      "dismissedPriceRequestAlerts",
      JSON.stringify(updated),
    );
  };

  const handleRequestPrice = (shipmentId: number) => {
    requestPrice(shipmentId);
  };

  // Fetch containers assigned to this shipment
  const { data: containersData } = useContainers({ ship_id: shipmentId });
  const assignedContainers = containersData?.items || [];
  const assignedContainerIds = assignedContainers.map((c) => c.id);

  // Get columns; hide Actions column when status is not "created" (e.g. price_requested)
  const columns = useContainerAssignColumns({
    activeShipmentId: shipmentId,
    assignedContainers: assignedContainerIds,
    onAssign: (containerId) => {
      assignContainers({ shipmentId, containerIds: [containerId] });
    },
    onRemove: (containerId) => {
      removeContainer({ shipmentId, containerId });
    },
    data: assignedContainers,
    showActionsColumn: shipment?.status === "created",
  });

  const handleDelete = () => {
    deleteShipment(shipmentId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-[400px] w-full" />
        <Skeleton className="h-[500px] w-full" />
      </div>
    );
  }

  if (error || !shipment) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8">
            <p className="text-destructive text-lg font-medium mb-2">
              {t("shipment:detail.failed_to_load")}
            </p>
            <p className="text-muted-foreground mb-4">
              {t("shipment:detail.not_found")}
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/dashboard/shipments")}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t("shipment:detail.back_to_shipments")}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Mobile layout: match reference design (selected shipment card, documents, containers, request price)
  const containerSizeLabel = (size: string) =>
    size === "forty_feet" ? "40ft" : "20ft";
  const containerTypeLabel = (type: string) =>
    type === "dry"
      ? "Dry Van"
      : type === "reefer"
        ? "Reefer"
        : type === "open_top"
          ? "Open Top"
          : type === "tank"
            ? "Tank"
            : type;

  const containerStatusLabel = (status: string | undefined) => {
    if (!status) return "ASSIGNED";
    const s = status.toLowerCase();
    if (s === "in_transit") return "IN TRANSIT";
    if (s === "delivered" || s === "completed") return "DELIVERED";
    if (
      s.includes("accepted") ||
      s.includes("allocated") ||
      s.includes("ready") ||
      s === "created" ||
      s === "price_requested" ||
      s === "priced"
    )
      return "ASSIGNED";
    return status.replace(/_/g, " ").toUpperCase();
  };

  const isContainerInTransit = (status: string | undefined) => {
    if (!status) return false;
    return status.toLowerCase() === "in_transit";
  };

  if (isMobile) {
    return (
      <div className="space-y-4 pb-6">
        <header className="flex items-center justify-between gap-2">
          <Link
            href="/dashboard/shipments"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t("shipment:title")}
          </Link>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 gap-1.5 text-primary hover:text-primary hover:bg-primary/10"
              asChild
            >
              <Link href={`/dashboard/shipments/placeholder/tracking?id=${shipmentId}`}>
                <Navigation className="h-4 w-4" />
                {t("shipment:track.track")}
              </Link>
            </Button>
            {shipment.status === "created" && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9"
                  onClick={() => setShowUpdateDrawer(true)}
                  aria-label="Update shipment"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => setShowDeleteDialog(true)}
                  aria-label="Delete shipment"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </header>

        {/* Selected Shipment card — improved UI */}
        <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
          <div className="border-l-4 border-l-primary bg-primary/5 px-4 py-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/15">
                <Truck className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm font-semibold text-foreground truncate">
                {t("shipment:detail.selected_shipment")}
              </span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary" className="shrink-0 font-mono text-xs">
                {t("shipment:bol_number")}
                {shipment.shipment_details?.bill_of_lading_number ?? shipment.id}
              </Badge>
              <span className="text-[10px] font-mono font-medium text-primary">
                {shipment.tracking_number ?? t("shipment:no_tracking_number")}
              </span>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="rounded-lg bg-muted/40 p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("common:labels.origin")}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {formatLocation(shipment.origin)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateShort(shipment.pickup_date)}
                  </p>
                </div>
                <ArrowRight
                  className="h-5 w-5 text-primary shrink-0"
                  aria-hidden
                />
                <div className="min-w-0 flex-1 text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {t("common:labels.destination")}
                  </p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {formatLocation(shipment.destination)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center justify-end gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDateShort(shipment.delivery_date)}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border border-border/80 bg-background/50 py-2.5 px-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("shipment:detail.estimated_arrival")}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDateLong(shipment.delivery_date)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Documents — folder + Documents, Upload right, list (no outer card) */}
        <ShipmentDocumentsCard shipId={shipment.id} variant="mobile" />

        {/* Transporter Quotes — only for priced shipments */}
        {shipment.status === "priced" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  {t("shipment:quotes.title")}
                  {transporterGroups.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({transporterGroups.length})
                    </span>
                  )}
                </CardTitle>
                {transporterGroups.length > 1 && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-primary hover:text-primary"
                    onClick={handleToggleAllTransporters}
                  >
                    {selectedTransporterIds.size === transporterGroups.length
                      ? t("shipment:quotes.deselect_all")
                      : t("shipment:quotes.select_all")}
                  </Button>
                )}
              </div>
              <CardDescription className="mt-1">
                {t("shipment:quotes.select_hint")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 px-4 pt-0">
              {isLoadingQuotes ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full rounded-xl" />
                  <Skeleton className="h-24 w-full rounded-xl" />
                </div>
              ) : transporterGroups.length === 0 ? (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-8 px-4 text-center">
                  <Package className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t("shipment:quotes.no_available")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("shipment:quotes.will_appear")}
                  </p>
                </div>
              ) : (
                transporterGroups.map((group: ShipperShipItemsItem) => {
                  const isSelected = selectedTransporterIds.has(
                    group.transporter_id,
                  );
                  const totalPrice =
                    group.total_price != null ? Number(group.total_price) : 0;
                  const currency = group.currency ?? "ETB";
                  const containerCount = group.total_containers ?? 0;

                  const allContainers = group.ship_items.flatMap(
                    (item: ShipItem) => item.containers ?? [],
                  );

                  return (
                    <div
                      key={group.transporter_id}
                      className={`
                        rounded-xl border overflow-hidden transition-all
                        ${isSelected
                          ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary/30"
                          : "border-border bg-card"
                        }
                      `}
                    >
                      {/* Tappable header */}
                      <button
                        type="button"
                        onClick={() =>
                          handleToggleTransporter(group.transporter_id)
                        }
                        className="w-full p-4 text-left"
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() =>
                              handleToggleTransporter(group.transporter_id)
                            }
                            className="mt-0.5 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                                  <Truck className="h-3.5 w-3.5 text-blue-500" />
                                </div>
                                <span className="text-sm font-semibold text-foreground">
                                  {t("shipment:quotes.transporter", { id: group.transporter_id })}
                                </span>
                              </div>
                              <Badge
                                variant="outline"
                                className="shrink-0 text-xs"
                              >
                                {t("common:status.pending")}
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/60">
                              <span className="text-xs text-muted-foreground">
                                {t("shipment:quotes.containers_count", { count: containerCount })}
                              </span>
                              <p className="text-base font-bold text-foreground">
                                {totalPrice.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{" "}
                                <span className="text-xs font-medium text-muted-foreground">
                                  {currency}
                                </span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </button>

                      {/* See containers button */}
                      {allContainers.length > 0 && (
                        <div className="border-t border-border/60 px-4 pb-3 pt-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="w-full text-primary hover:text-primary hover:bg-primary/10 gap-1.5"
                            onClick={(e) => {
                              e.stopPropagation();
                              setContainersSheetGroup(group);
                            }}
                          >
                            <ContainerIcon className="h-4 w-4" />
                            {t("shipment:quotes.see_containers", { count: allContainers.length })}
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}

              {/* Accept button */}
              {selectedTransporterIds.size > 0 && (
                <Button
                  className="w-full font-semibold gap-2"
                  size="lg"
                  onClick={() => setAcceptDialogOpen(true)}
                  disabled={isAccepting}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  {t("shipment:quotes.accept_selected", { count: selectedTransporterIds.size })}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Containers — hidden for priced shipments (shown inside quotes) */}
        {shipment.status !== "priced" && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-base font-semibold">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <ContainerIcon className="h-4 w-4 text-primary" />
                  </div>
                  {t("shipment:containers.title")}
                  {assignedContainers.length > 0 && (
                    <span className="text-sm font-normal text-muted-foreground">
                      ({assignedContainers.length})
                    </span>
                  )}
                </CardTitle>
                {shipment.status === "created" && (
                  <Button
                    size="sm"
                    onClick={() => setAssignSheetOpen(true)}
                    className="shrink-0"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    {t("common:buttons.add")}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2 px-4 pt-0">
              {assignedContainers.length === 0 ? (
                <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-8 px-4 text-center">
                  <ContainerIcon className="mx-auto h-10 w-10 text-muted-foreground/50 mb-2" />
                  <p className="text-sm font-medium text-foreground mb-1">
                    {t("shipment:containers.no_assigned")}
                  </p>
                  <p className="text-xs text-muted-foreground mb-4">
                    {t("shipment:containers.add_hint")}
                  </p>
                  {shipment.status === "created" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setAssignSheetOpen(true)}
                      className="border-primary text-primary hover:bg-primary/10"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      {t("shipment:containers.select_containers")}
                    </Button>
                  )}
                </div>
              ) : (
                assignedContainers.map((c: Container) => (
                  <div
                    key={c.id}
                    className="rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("shipment:detail.container_name")}
                        </p>
                        <p className="font-semibold text-foreground truncate mt-0.5">
                          {c.container_number}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            isContainerInTransit(c.status)
                              ? "secondary"
                              : "default"
                          }
                          className="text-[10px] uppercase font-medium"
                        >
                          {containerStatusLabel(c.status)}
                        </Badge>
                        {shipment.status === "created" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => setRemoveConfirmContainerId(c.id)}
                            aria-label={`Remove ${c.container_number}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-3 pt-3 border-t border-border">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("shipment:detail.size_type")}
                        </p>
                        <p className="text-sm text-foreground">
                          {containerSizeLabel(c.container_size)} /{" "}
                          {containerTypeLabel(c.container_type)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("common:labels.weight")}
                        </p>
                        <p className="text-sm text-foreground">
                          {Number(c.gross_weight).toLocaleString()}{" "}
                          {c.gross_weight_unit ?? "kg"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Pickup & delivery addresses (mobile) */}
        <div className="space-y-3">
          <h3 className="text-base font-semibold text-foreground">
            {t("shipment:detail.pickup_delivery")}
          </h3>
          <div className="space-y-2">
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {t("shipment:detail.pickup_address")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common:labels.address")}
                  </p>
                  <p
                    className="text-sm font-medium text-foreground"
                    title={shipment.pickup_facility?.name}
                  >
                    {shipment.pickup_facility?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {shipment.pickup_facility?.address ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.pickup_facility?.region ?? "—"}
                    {shipment.pickup_facility?.country
                      ? `, ${shipment.pickup_facility.country}`
                      : ""}
                  </p>
                </div>
                <div className="min-w-0 border-l border-border pl-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common:labels.contact")}
                  </p>
                  <p className="text-sm text-foreground">
                    {shipment.pickup_facility?.contact_name ?? "—"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>
                      {shipment.pickup_facility?.contact_phone_number ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="break-all">
                      {shipment.pickup_facility?.contact_email ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-xl border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {t("shipment:detail.delivery_address")}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common:labels.address")}
                  </p>
                  <p
                    className="text-sm font-medium text-foreground"
                    title={shipment.delivery_facility?.name}
                  >
                    {shipment.delivery_facility?.name ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {shipment.delivery_facility?.address ?? "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {shipment.delivery_facility?.region ?? "—"}
                    {shipment.delivery_facility?.country
                      ? `, ${shipment.delivery_facility.country}`
                      : ""}
                  </p>
                </div>
                <div className="min-w-0 border-l border-border pl-3">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    {t("common:labels.contact")}
                  </p>
                  <p className="text-sm text-foreground">
                    {shipment.delivery_facility?.contact_name ?? "—"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <Phone className="h-3 w-3 shrink-0" />
                    <span>
                      {shipment.delivery_facility?.contact_phone_number ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                    <Mail className="h-3 w-3 shrink-0" />
                    <span className="break-all">
                      {shipment.delivery_facility?.contact_email ?? "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ViewContainersSheet
          open={assignSheetOpen}
          onOpenChange={setAssignSheetOpen}
          activeShipmentId={shipmentId}
          onAssignContainers={(containerIds) => {
            assignContainers({ shipmentId, containerIds });
            setAssignSheetOpen(false);
          }}
        />

        <Dialog
          open={removeConfirmContainerId !== null}
          onOpenChange={(open) => !open && setRemoveConfirmContainerId(null)}
        >
          <DialogContent className="sm:max-w-xs">
            <DialogHeader>
              <DialogTitle>{t("shipment:remove_container.title")}</DialogTitle>
              <DialogDescription>
                {t("shipment:remove_container.message")}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => setRemoveConfirmContainerId(null)}
              >
                {t("common:buttons.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (removeConfirmContainerId != null) {
                    removeContainer({
                      shipmentId,
                      containerId: removeConfirmContainerId,
                    });
                    setRemoveConfirmContainerId(null);
                  }
                }}
              >
                {t("common:buttons.remove")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Request price — full width */}
        {shipment.status === "created" && assignedContainers.length > 0 && (
          <Button
            className="w-full font-semibold"
            onClick={() => requestPrice(shipmentId)}
            disabled={isRequestingPrice}
          >
            {isRequestingPrice ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t("shipment:price.requesting")}
              </>
            ) : (
              t("shipment:price.request_price")
            )}
          </Button>
        )}

        <UpdateShipmentDrawer
          open={showUpdateDrawer}
          onOpenChange={setShowUpdateDrawer}
          shipment={shipment}
        />

        {/* Delete dialog still needed on mobile */}
        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <DialogContent>
            <DialogHeader>
            <DialogTitle>{t("shipment:delete.title")}</DialogTitle>
            <DialogDescription>
              {t("shipment:delete.confirm", { id: shipment.id })}
              {assignedContainers.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  {t("shipment:delete.warning_containers", { count: assignedContainers.length })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("shipment:delete.deleting")}
                </>
              ) : (
                t("shipment:delete.title")
              )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Accept quotes confirmation sheet */}
        <Sheet open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
          <SheetContent
            side="bottom"
            className="rounded-t-2xl flex flex-col p-0"
          >
            <SheetHeader className="px-6 pt-6 pb-2 text-left">
              <SheetTitle className="text-xl font-bold">
                {t("shipment:quotes.accept_quotes")}
              </SheetTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("shipment:quotes.accept_confirm", { count: selectedTransporterIds.size, id: shipmentId })}
              </p>
            </SheetHeader>
            <div className="px-6 py-4 space-y-3">
              {transporterGroups
                .filter((g) => selectedTransporterIds.has(g.transporter_id))
                .map((group) => (
                  <div
                    key={group.transporter_id}
                    className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {t("shipment:quotes.transporter", { id: group.transporter_id })}
                      </span>
                    </div>
                    <span className="text-sm font-semibold">
                      {Number(group.total_price ?? 0).toLocaleString(
                        undefined,
                        {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        },
                      )}{" "}
                      {group.currency ?? "ETB"}
                    </span>
                  </div>
                ))}
            </div>
            <SheetFooter className="flex flex-row gap-2 border-t p-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setAcceptDialogOpen(false)}
                disabled={isAccepting}
              >
                {t("common:buttons.cancel")}
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={confirmAcceptQuotes}
                disabled={isAccepting}
              >
                {isAccepting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("shipment:quotes.accepting")}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    {t("common:buttons.accept")}
                  </>
                )}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Container details sheet */}
        <Sheet
          open={containersSheetGroup !== null}
          onOpenChange={(open) => !open && setContainersSheetGroup(null)}
        >
          <SheetContent
            side="bottom"
            className="rounded-t-2xl flex flex-col p-0 max-h-[85vh]"
          >
            <SheetHeader className="px-6 pt-6 pb-2 text-left shrink-0">
              <SheetTitle className="text-lg font-bold flex items-center gap-2">
                <ContainerIcon className="h-5 w-5 text-primary" />
                {t("shipment:containers.container_details")}
              </SheetTitle>
              {containersSheetGroup && (
                <p className="text-sm text-muted-foreground">
                  {t("shipment:containers.containers_from", {
                    count: containersSheetGroup.ship_items.flatMap(
                      (i: ShipItem) => i.containers ?? [],
                    ).length,
                    id: containersSheetGroup.transporter_id,
                  })}
                </p>
              )}
            </SheetHeader>
            <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
              {containersSheetGroup?.ship_items
                .flatMap((item: ShipItem) => item.containers ?? [])
                .map((container) => (
                  <div
                    key={container.id}
                    className="rounded-xl border border-border bg-card p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {container.container_number || "N/A"}
                      </span>
                      {container.is_returning ? (
                        <Badge
                          variant="secondary"
                          className="text-[10px] shrink-0"
                        >
                          {t("common:status.returning")}
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0"
                        >
                          {t("common:status.one_way")}
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 pt-2 border-t border-border/60">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("common:labels.size")}
                        </p>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {container.container_size === "forty_feet"
                            ? "40ft"
                            : "20ft"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("common:labels.type")}
                        </p>
                        <p className="text-sm font-medium text-foreground capitalize mt-0.5">
                          {container.container_type || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {t("common:labels.weight")}
                        </p>
                        <p className="text-sm font-medium text-foreground mt-0.5">
                          {container.gross_weight
                            ? `${Number(container.gross_weight).toLocaleString()} ${container.gross_weight_unit || "kg"}`
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => router.push("/dashboard/shipments")}
          className="hover:text-foreground transition-colors"
        >
          {t("shipment:title")}
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">
          Shipment #{shipment.id}
        </span>
      </div>

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-bold">Shipment #{shipment.id}</h1>

            <Badge
              variant={getStatusVariant(shipment.status ?? "created")}
              className="text-xs"
            >
              {(shipment.status ?? "created")
                .replace(/_/g, " ")
                .replace(/\b\w/g, (l) => l.toUpperCase())}
            </Badge>
          </div>
          <span className="text-sm font-mono font-medium text-primary">
            {shipment.tracking_number ?? t("shipment:no_tracking_number")}
          </span>

          <p className="text-sm text-muted-foreground">
            {t("shipment:detail.created_on", { date: formatDateLong(shipment.pickup_date) })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Track Shipment button */}
          <Button
            variant="outline"
            className="shrink-0 gap-2"
            asChild
          >
            <Link href={`/dashboard/shipments/placeholder/tracking?id=${shipmentId}`}>
              <Navigation className="h-4 w-4" />
              {t("shipment:track.track_shipment")}
            </Link>
          </Button>
          {/* Request Price Button - Only show when status is "created" and has containers */}
          {shipment.status === "created" && assignedContainers.length > 0 && (
            <Button
              variant="default"
              onClick={() => {
                resetPriceRequestError();
                requestPrice(shipmentId);
              }}
              disabled={isRequestingPrice}
              className="shrink-0"
            >
              {isRequestingPrice ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("shipment:price.requesting_dots")}
                </>
              ) : (
                t("shipment:price.request_price")
              )}
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsEditMode(!isEditMode)}
            className="shrink-0"
          >
            <Edit className="h-4 w-4 mr-2" />
            {isEditMode ? t("shipment:edit.cancel_edit") : t("shipment:edit.edit_shipment")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteDialog(true)}
            className="shrink-0"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            {t("common:buttons.delete")}
          </Button>
        </div>
      </div>

      {/* Price Request Error Alert - Shows when request fails (e.g. missing documents) */}
      {priceRequestError && (
        <Card className="border-red-500 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50">
                  <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                  {t("shipment:price.unable_to_request")}
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-line">
                  {priceRequestError?.message || "Failed to request price"}
                </p>
              </div>
              <button
                onClick={() => resetPriceRequestError()}
                className="flex-shrink-0 rounded-md p-1.5 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors"
                aria-label="Dismiss error"
              >
                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Price Request Confirmation Message Box - Shows when status is price_requested */}
      {shouldShowPriceRequestAlert && (
        <Card className="border-green-500 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-1">
                  {t("shipment:price.success_title")}
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t("shipment:price.success_message")}
                </p>
              </div>
              <button
                onClick={handleDismissAlert}
                className="shrink-0 rounded-md p-1.5 hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors"
                aria-label="Dismiss message"
              >
                <X className="h-5 w-5 text-green-600 dark:text-green-400" />
              </button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("shipment:containers.assigned")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignedContainers.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("shipment:containers.total")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("shipment:route.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Navigation className="h-5 w-5 text-blue-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate capitalize">
                  {shipment.origin.replace(/_/g, " ")}
                </p>
                <p className="text-xs text-muted-foreground">{t("common:labels.to")}</p>
                <p className="text-sm font-semibold truncate capitalize">
                  {shipment.destination.replace(/_/g, " ")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("shipment:detail.delivery_date")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Calendar className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  {formatDateLong(shipment.delivery_date)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("shipment:route.scheduled_delivery")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Update Form or Details View */}
      {isEditMode ? (
        <UpdateShipmentForm
          shipment={shipment}
          onSuccess={() => {
            setIsEditMode(false);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details - Takes 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Route Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  {t("shipment:detail.route_info")}
                </CardTitle>
                <CardDescription>
                  {t("shipment:detail.route_description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{t("common:labels.origin")}</span>
                    </div>
                    <p className="text-base font-medium capitalize">
                      {shipment.origin.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{t("common:labels.destination")}</span>
                    </div>
                    <p className="text-base font-medium capitalize">
                      {shipment.destination.replace(/_/g, " ")}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{t("shipment:detail.pickup_date")}</span>
                    </div>
                    <p className="text-base font-medium">
                      {formatDateLong(shipment.pickup_date)}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{t("shipment:detail.delivery_date")}</span>
                    </div>
                    <p className="text-base font-medium">
                      {formatDateLong(shipment.delivery_date)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Facilities and Shipment Details - 3 columns side by side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Pickup Facility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Building2 className="h-5 w-5" />
                    {t("shipment:detail.pickup_address")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm font-medium mb-1">
                    {shipment.pickup_facility?.name ?? "—"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {shipment.pickup_facility?.address ?? "—"}
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {shipment.pickup_facility?.region ?? "—"},{" "}
                    {shipment.pickup_facility?.country ?? "—"}
                  </p>

                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("shipment:detail.contact_person")}
                    </p>
                    <p className="text-sm font-medium">
                      {shipment.pickup_facility?.contact_name ?? "—"}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>
                        {shipment.pickup_facility?.contact_phone_number ?? "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3" />
                      <span>
                        {shipment.pickup_facility?.contact_email ?? "—"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Facility */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <CheckCircle2 className="h-5 w-5" />
                    {t("shipment:detail.delivery_address")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">
                      {shipment.delivery_facility?.name ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shipment.delivery_facility?.address ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {shipment.delivery_facility?.region ?? "—"},{" "}
                      {shipment.delivery_facility?.country ?? "—"}
                    </p>
                  </div>

                  <Separator />
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("shipment:detail.contact_person")}
                    </p>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {shipment.delivery_facility?.contact_name ?? "—"}
                      </p>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span>
                          {shipment.delivery_facility?.contact_phone_number ??
                            "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span>
                          {shipment.delivery_facility?.contact_email ?? "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipment Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <FileText className="h-5 w-5" />
                    {t("shipment:detail.shipment_details")}
                  </CardTitle>
                  <CardDescription className="text-xs">
                    {t("shipment:detail.documentation_ref")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      {t("shipment:detail.bill_of_lading")}
                    </p>
                    <p className="text-sm font-mono">
                      {shipment.shipment_details?.bill_of_lading_number ??
                        "N/A"}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Shipment Documents */}
            <ShipmentDocumentsCard shipId={shipment.id} />
          </div>

          {/* Sidebar - Takes 1/3 width */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t("shipment:detail.quick_info")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("shipment:detail.shipment_id")}
                  </p>
                  <p className="text-sm font-mono font-semibold">
                    #{shipment.id}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("shipment:detail.tracking_number")}
                  </p>
                  <p className="text-sm font-mono font-semibold text-primary">
                    {shipment.tracking_number ?? "N/A"}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("shipment:detail.shipper_id")}
                  </p>
                  <p className="text-sm font-semibold">
                    #{shipment.shipper_id}
                  </p>
                </div>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {t("common:labels.status")}
                  </p>

                  {shipment.status ? (
                    <Badge
                      variant={getStatusVariant(shipment.status)}
                      className="mt-1"
                    >
                      {shipment.status
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase())}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="mt-1">
                      N/A
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Container Assignment Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("shipment:containers.assignment")}
          </CardTitle>
          <CardDescription>
            {t("shipment:containers.assignment_desc")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContainerAssignTable
            columns={columns}
            data={assignedContainers}
            activeShipmentId={shipmentId}
            onAssignContainer={(containerId) => {
              assignContainers({ shipmentId, containerIds: [containerId] });
            }}
            onAssignContainers={(containerIds) => {
              assignContainers({ shipmentId, containerIds });
            }}
            onRequestPrice={handleRequestPrice}
            shipmentStatus={shipment?.status}
            isRequestingPrice={isRequestingPrice}
            hideMessageBox={true}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("shipment:delete.title")}</DialogTitle>
            <DialogDescription>
              {t("shipment:delete.confirm", { id: shipment.id })}
              {assignedContainers.length > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  {t("shipment:delete.warning_containers_full", { count: assignedContainers.length })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              {t("common:buttons.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {t("shipment:delete.deleting")}
                </>
              ) : (
                t("shipment:delete.title")
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
