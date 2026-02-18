"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { CreateShipmentDrawer } from "@/app/modules/shipment/ui/components/create-shipment-drawer";
import { CreateShipmentForm } from "@/app/modules/shipment/ui/components/create-shipment-form";
import { ShipmentSidebar } from "@/app/modules/shipment/ui/components/shipment-sidebar";
import { ContainerAssignTable } from "@/app/modules/shipment/ui/components/container-assign-table";
import { useContainerAssignColumns } from "@/app/modules/shipment/ui/components/container-assign-columns";
import { useShipments } from "@/app/modules/shipment/server/hooks/use-shipments";
import { useContainers } from "@/app/modules/container/server/hooks/use-containers";
import { useAssignContainers } from "@/app/modules/shipment/server/hooks/use-assign-container";
import { useRemoveContainer } from "@/app/modules/shipment/server/hooks/use-remove-container";
import { useGetPrice } from "@/app/modules/shipment/server/hooks/use-get-price";
import { useRequestPrice } from "@/app/modules/shipment/server/hooks/use-request-price";
import { Skeleton } from "@/components/ui/skeleton";
import { ShipmentDocumentsCard } from "../components/shipment-documents/shipment-documents-card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Plus, Truck, Calendar, ChevronRight } from "lucide-react";
import { PricedShipItemsTable } from "@/app/modules/shipment/ui/components/priced-ship-items-table";
import { AcceptedShipItemsTable } from "@/app/modules/shipment/ui/components/accepted-ship-items-table";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Shipment } from "@/app/modules/shipment/server/types/shipment.types";

function formatLocation(location: string) {
  return location
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDateShort(dateString: string) {
  try {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "N/A";
  }
}

export function ShipmentsView() {
  const isMobile = useIsMobile();
  const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("created");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sidebarPage, setSidebarPage] = useState(1);
  const SIDEBAR_PER_PAGE = 10;

  // Fetch data with server-side pagination and status filtering
  const { data: shipmentsResponse, isLoading: shipmentsLoading } = useShipments(
    { page: sidebarPage, per_page: SIDEBAR_PER_PAGE, status: activeTab },
  );

  // Also fetch all shipments (without status filter) for tab counts
  const { data: allShipmentsResponse } = useShipments();

  const filteredShipments = useMemo(
    () => shipmentsResponse?.items || [],
    [shipmentsResponse?.items],
  );

  const allShipments = useMemo(
    () => allShipmentsResponse?.items || [],
    [allShipmentsResponse?.items],
  );

  // Get priced shipments count
  const pricedShipmentsCount = useMemo(
    () => allShipments.filter((s) => s.status === "priced").length,
    [allShipments],
  );

  // Filter shipments by status based on active tab
  const filteredShipments = useMemo(
    () => allShipments.filter((s) => s.status === activeTab),
    [allShipments, activeTab],
  );

  // Count per status for mobile tab cards
  const statusCounts = useMemo(
    () => ({
      created: allShipments.filter((s) => s.status === "created").length,
      price_requested: allShipments.filter(
        (s) => s.status === "price_requested",
      ).length,
      priced: allShipments.filter((s) => s.status === "priced").length,
      accepted_by_shipper: allShipments.filter(
        (s) => s.status === "accepted_by_shipper",
      ).length,
    }),
    [allShipments],
  );

  // Auto-select first shipment when filtered list changes
  useEffect(() => {
    if (filteredShipments.length > 0) {
      const isStillInList = filteredShipments.some(
        (s) => s.id === activeShipmentId,
      );
      if (!isStillInList) {
        setActiveShipmentId(filteredShipments[0].id);
      }
    } else {
      setActiveShipmentId(null);
    }
  }, [filteredShipments, activeShipmentId]);

  // Fetch containers assigned to the active shipment (only when activeShipmentId is set)
  const { data: assignedContainersData } = useContainers(
    activeShipmentId ? { ship_id: activeShipmentId } : undefined,
    { enabled: !!activeShipmentId },
  );

  // Fetch all containers for counts and search
  const { data: allContainersData } = useContainers();

  const assignedContainers = assignedContainersData?.items || [];
  const allContainers = allContainersData?.items || [];

  // Use containers assigned to the active shipment - always empty array if no active shipment
  const filteredContainers = activeShipmentId ? assignedContainers : [];

  // Calculate container counts per shipment
  const containerCounts = new Map<number, number>();
  allContainers.forEach((container) => {
    if (container.ship_id) {
      containerCounts.set(
        container.ship_id,
        (containerCounts.get(container.ship_id) || 0) + 1,
      );
    }
  });

  // Mutations
  const { mutate: assignContainers } = useAssignContainers();
  const { mutate: removeContainer } = useRemoveContainer();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for Get price action
  const { mutate: getPrice } = useGetPrice();
  const { mutate: requestPrice, isPending: isRequestingPrice } =
    useRequestPrice();

  // Get active shipment status
  const activeShipment = allShipments.find((s) => s.id === activeShipmentId);

  // Get assigned container IDs for active shipment (for column actions)
  const assignedContainerIds = assignedContainers.map((c) => c.id);

  // Handle container assignment (single or bulk)
  const handleAssignContainer = (containerId: number) => {
    if (!activeShipmentId) return;
    assignContainers({
      shipmentId: activeShipmentId,
      containerIds: [containerId],
    });
  };

  const handleAssignContainers = (containerIds: number[]) => {
    if (!activeShipmentId || containerIds.length === 0) return;
    assignContainers({ shipmentId: activeShipmentId, containerIds });
  };

  // Handle container removal
  const handleRemoveContainer = (containerId: number) => {
    if (!activeShipmentId) return;
    removeContainer({ shipmentId: activeShipmentId, containerId });
  };

  // Handle shipment creation success
  const handleShipmentCreated = (shipmentId: string) => {
    const newId = parseInt(shipmentId, 10);
    if (!isNaN(newId)) {
      setActiveShipmentId(newId);
      setShowCreateForm(false); // Hide form after creation
    }
  };

  const handleSelectShipment = (shipmentId: number) => {
    setActiveShipmentId(shipmentId);
  };

  // Handle request price
  const handleRequestPrice = (shipmentId: number) => {
    requestPrice(shipmentId);
  };

  // Get columns; hide Actions column when status is not "created" (e.g. price_requested tab)
  const columns = useContainerAssignColumns({
    activeShipmentId,
    assignedContainers: assignedContainerIds,
    onAssign: handleAssignContainer,
    onRemove: handleRemoveContainer,
    data: filteredContainers,
    showActionsColumn: activeShipment?.status === "created",
  });

  // Loading state - only show skeleton on initial load, not on refetch
  if (shipmentsLoading && !allShipments.length) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-[400px] w-full" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div>
            <Skeleton className="h-[500px] w-full" />
          </div>
          <div className="lg:col-span-3">
            <Skeleton className="h-[500px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Mobile: list/selection screen — tap a shipment to open detail
  const tabLabels: Record<string, string> = {
    created: "Created",
    price_requested: "Price requested",
    priced: "Priced",
    accepted_by_shipper: "Accepted",
  };

  if (isMobile) {
    return (
      <div className="space-y-4 pb-6">
        <header className="flex items-center justify-between gap-2 pb-3 border-b border-border">
          <h1 className="text-xl font-bold tracking-tight text-foreground">
            Shipments
          </h1>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            size="sm"
            className="shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create
          </Button>
        </header>
        <CreateShipmentDrawer
          open={showCreateForm}
          onOpenChange={setShowCreateForm}
          onSuccess={handleShipmentCreated}
          onCancel={() => setShowCreateForm(false)}
        />
        <div className="grid grid-cols-4 gap-1.5">
          {(
            [
              "created",
              "price_requested",
              "priced",
              "accepted_by_shipper",
            ] as const
          ).map((tab) => {
            const isActive = activeTab === tab;
            const count = statusCounts[tab];
            const showNotification =
              tab === "priced" && pricedShipmentsCount > 0;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`
                    relative min-w-0 rounded-lg border p-2 text-center transition-colors
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2
                    ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-sm"
                        : "border-border bg-card hover:bg-muted/30 active:bg-muted/50"
                    }
                  `}
              >
                {showNotification && (
                  <span className="absolute -top-1 -right-1 flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}
                <p className="text-[10px] font-medium text-muted-foreground truncate leading-tight">
                  {tabLabels[tab]}
                </p>
                <p className="text-lg font-bold text-foreground tabular-nums mt-0.5">
                  {count}
                </p>
              </button>
            );
          })}
        </div>
        <div className="space-y-2">
          {filteredShipments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-muted-foreground/30 bg-muted/20 py-12 px-4 text-center">
              <Truck className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">
                No shipments in this tab
              </p>
              <p className="text-xs text-muted-foreground">
                Create a shipment or switch to another tab.
              </p>
            </div>
          ) : (
            filteredShipments.map((shipment: Shipment) => (
              <Link
                key={shipment.id}
                href={`/dashboard/shipments/placeholder?id=${shipment.id}`}
                className="block"
              >
                <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden transition-colors hover:bg-muted/30 active:bg-muted/50">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-medium text-muted-foreground">
                            BOL #
                            {shipment.shipment_details?.bill_of_lading_number ??
                              shipment.id}
                          </span>
                          <Badge
                            variant={
                              shipment.status === "accepted_by_shipper"
                                ? "default"
                                : "secondary"
                            }
                            className="text-[10px] uppercase font-medium shrink-0"
                          >
                            {shipment.status?.replace("_", " ") ?? ""}
                          </Badge>
                        </div>
                        <div className="mt-2 rounded-md bg-muted/40 px-2.5 py-2">
                          <div className="flex items-center gap-2 text-sm">
                            <span className="truncate font-semibold text-foreground">
                              {formatLocation(shipment.origin)}
                            </span>
                            <span className="text-muted-foreground shrink-0">
                              →
                            </span>
                            <span className="truncate font-semibold text-foreground">
                              {formatLocation(shipment.destination)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3 shrink-0" />
                            <span>
                              {formatDateShort(shipment.pickup_date)} –{" "}
                              {formatDateShort(shipment.delivery_date)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0 mt-1" />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-6">
      {/* Top Section with Header */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Shipments
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Manage and track your shipments in one place
            </p>
          </div>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="sm:w-auto w-full"
          >
            {!showCreateForm && <Plus className="h-4 w-4 mr-2" />}
            {showCreateForm ? "Cancel" : "Create Shipment"}
          </Button>
        </div>

        {showCreateForm && (
          <CreateShipmentForm
            onSuccess={(id) => {
              handleShipmentCreated(id);
              setShowCreateForm(false);
            }}
          />
        )}

        <Separator className="my-2" />
      </div>

      {/* Main Content Area - Shipments Sidebar + Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Shipments Sidebar - Takes 1/4 width on desktop, full width on mobile */}
        <div className="lg:col-span-1">
          <Card className="border shadow-sm h-full">
            <CardContent className="p-0">
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold">Active Shipments</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {filteredShipments.length} shipment(s) in {activeTab} status
                </p>
              </div>
              <ShipmentSidebar
                shipments={filteredShipments}
                activeShipmentId={activeShipmentId}
                onSelectShipment={handleSelectShipment}
                containerCounts={containerCounts}
                page={sidebarPage}
                totalPages={sidebarTotalPages}
                onPageChange={setSidebarPage}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side: Tabs + Content Area - Takes 3/4 width on desktop, full width on mobile */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border p-1 shadow-sm">
            <Tabs
              defaultValue="created"
              onValueChange={handleTabChange}
              className="w-full"
            >
              <div className="px-2 sm:px-4 py-3">
                <h2 className="text-lg font-semibold mb-3">Shipment Status</h2>
                <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 gap-1 bg-muted/30 border">
                  <TabsTrigger
                    value="created"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border rounded-md transition-all duration-200"
                  >
                    <span className="font-medium text-sm">Created</span>
                    <Badge
                      variant="secondary"
                      className="ml-1 h-6 min-w-6 justify-center px-1.5 font-medium"
                    >
                      {
                        allShipments.filter((s) => s.status === "created")
                          .length
                      }
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="price_requested"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border rounded-md transition-all duration-200"
                  >
                    <span className="font-medium text-sm">Price Requested</span>
                    <Badge
                      variant="secondary"
                      className="ml-1 h-6 min-w-6 justify-center px-1.5 font-medium"
                    >
                      {
                        allShipments.filter(
                          (s) => s.status === "price_requested",
                        ).length
                      }
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger
                    value="priced"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border rounded-md transition-all duration-200 relative"
                  >
                    <span className="font-medium text-sm">Priced</span>
                    <div className="relative ml-1">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "h-6 min-w-6 justify-center px-1.5 font-medium",
                          pricedShipmentsCount > 0 &&
                            "bg-red-50 text-red-600 border border-red-200",
                        )}
                      >
                        {pricedShipmentsCount}
                      </Badge>
                      {pricedShipmentsCount > 0 && (
                        <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-400 border-2 border-white" />
                      )}
                    </div>
                  </TabsTrigger>
                  <TabsTrigger
                    value="accepted_by_shipper"
                    className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border rounded-md transition-all duration-200"
                  >
                    <span className="font-medium text-sm">Accepted</span>
                    <Badge
                      variant="secondary"
                      className="ml-1 h-6 min-w-6 justify-center px-1.5 font-medium"
                    >
                      {
                        allShipments.filter(
                          (s) => s.status === "accepted_by_shipper",
                        ).length
                      }
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Content Area Below Tabs */}
              <div className="mt-4 px-2 sm:px-4 pb-2">
                {/* Shipment Documents Card - Only show when there's an active shipment */}
                {activeShipmentId && (
                  <Card className="mb-4 border shadow-sm">
                    <CardContent className="p-4 sm:p-6">
                      <ShipmentDocumentsCard shipId={activeShipmentId} />
                    </CardContent>
                  </Card>
                )}

                {/* Main Content */}
                <div className="w-full">
                  {filteredShipments.length === 0 ? (
                    <Card className="border shadow-sm h-full">
                      <CardContent className="p-8 sm:p-12">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="rounded-full bg-primary/10 p-4 mb-4">
                            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-primary" />
                          </div>
                          <h3 className="text-lg sm:text-xl font-semibold mb-2">
                            {activeTab === "created"
                              ? "No shipments created"
                              : activeTab === "price_requested"
                                ? "No price requests"
                                : activeTab === "priced"
                                  ? "No quotes received"
                                  : "No shipments accepted"}
                          </h3>
                          <p className="text-muted-foreground max-w-sm text-sm sm:text-base mb-6">
                            {activeTab === "created"
                              ? "Get started by creating your first shipment using the form above."
                              : activeTab === "price_requested"
                                ? "Once you request pricing for a shipment, it will appear here."
                                : activeTab === "priced"
                                  ? "Shipments awaiting transporter quotes will appear here once priced."
                                  : "Your accepted shipments and their final quotes will be listed here."}
                          </p>
                          {activeTab === "created" && (
                            <Button
                              onClick={() => setShowCreateForm(true)}
                              variant="outline"
                              className="w-full sm:w-auto"
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Create First Shipment
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : activeTab === "priced" ? (
                    <Card className="border shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <PricedShipItemsTable
                          activeShipmentId={activeShipmentId}
                        />
                      </CardContent>
                    </Card>
                  ) : activeTab === "accepted_by_shipper" ? (
                    <Card className="border shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <AcceptedShipItemsTable
                          activeShipmentId={activeShipmentId}
                        />
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border shadow-sm overflow-hidden">
                      <CardContent className="p-0">
                        <ContainerAssignTable
                          columns={columns}
                          data={filteredContainers}
                          activeShipmentId={activeShipmentId}
                          onAssignContainer={handleAssignContainer}
                          onAssignContainers={handleAssignContainers}
                          onRequestPrice={handleRequestPrice}
                          shipmentStatus={activeShipment?.status}
                          isRequestingPrice={isRequestingPrice}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </div>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
