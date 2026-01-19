"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { PricedShipItemsTable } from "@/app/modules/shipment/ui/components/priced-ship-items-table";

export function ShipmentsView() {
  const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("created");

  // Fetch data
  const { data: shipmentsResponse, isLoading: shipmentsLoading } =
    useShipments();

  const allShipments = shipmentsResponse?.items || [];

  // Filter shipments by status based on active tab
  const filteredShipments = useMemo(() => 
    allShipments.filter((s) => s.status === activeTab),
    [allShipments, activeTab]
  );

  // Auto-select first shipment when filtered list changes
  useEffect(() => {
    if (filteredShipments.length > 0) {
      // Only auto-select if current activeShipmentId is not in the filtered list
      const isStillInList = filteredShipments.some((s) => s.id === activeShipmentId);
      if (!isStillInList) {
        setActiveShipmentId(filteredShipments[0].id);
      }
    } else {
      setActiveShipmentId(null);
    }
  }, [filteredShipments, activeShipmentId]);

  // Fetch containers assigned to the active shipment (only when activeShipmentId is set)
  const { data: assignedContainersData, isLoading: assignedContainersLoading } =
    useContainers(
      activeShipmentId ? { ship_id: activeShipmentId } : undefined,
      { enabled: !!activeShipmentId }
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
        (containerCounts.get(container.ship_id) || 0) + 1
      );
    }
  });

  // Mutations
  const { mutate: assignContainers } = useAssignContainers();
  const { mutate: removeContainer } = useRemoveContainer();
  const { mutate: getPrice, isPending: isGettingPrice } = useGetPrice();
  const { mutate: requestPrice, isPending: isRequestingPrice } =
    useRequestPrice();

  // Get active shipment status
  const activeShipment = allShipments.find((s) => s.id === activeShipmentId);

  // Get assigned container IDs for active shipment (for column actions)
  const assignedContainerIds = assignedContainers.map((c) => c.id);

  // Handle container assignment
  const handleAssignContainer = (containerId: number) => {
    if (!activeShipmentId) return;
    assignContainers({
      shipmentId: activeShipmentId,
      containerIds: [containerId],
    });
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
    }
  };

  // Clear selection when switching shipments
  const handleSelectShipment = (shipmentId: number) => {
    setActiveShipmentId(shipmentId);
  };

  // Handle get price
  const handleGetPrice = (containerIds: number[]) => {
    if (!activeShipmentId || containerIds.length === 0) return;
    getPrice({ shipmentId: activeShipmentId, containerIds });
  };

  // Handle request price
  const handleRequestPrice = (shipmentId: number) => {
    requestPrice(shipmentId);
  };

  // Get columns with actions
  const columns = useContainerAssignColumns({
    activeShipmentId,
    assignedContainers: assignedContainerIds,
    onAssign: handleAssignContainer,
    onRemove: handleRemoveContainer,
    shipmentStatus: activeShipment?.status,
    data: filteredContainers,
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

  return (
    <div className="space-y-6">
      {/* Create Shipment Form */}
      <CreateShipmentForm onSuccess={handleShipmentCreated} />
      <ShipmentDocumentsCard shipId={activeShipmentId} />

      <Tabs defaultValue="created" onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto p-1 gap-1 bg-muted/50 border">
          <TabsTrigger value="created" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="hidden sm:inline">Created</span>
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1">
              {allShipments.filter(s => s.status === "created").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="price_requested" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="hidden sm:inline">Price Requested</span>
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1">
              {allShipments.filter(s => s.status === "price_requested").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="priced" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="hidden sm:inline">Priced</span>
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1">
              {allShipments.filter(s => s.status === "priced").length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="accepted_by_shipper" className="flex items-center gap-2 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <span className="hidden sm:inline">Accepted</span>
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 justify-center px-1">
              {allShipments.filter(s => s.status === "accepted_by_shipper").length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          {/* Main Content: Sidebar + Container Table */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Shipment Sidebar - Takes 1/4 width, on the left */}
            <div className="lg:col-span-1">
              <ShipmentSidebar
                shipments={filteredShipments}
                activeShipmentId={activeShipmentId}
                onSelectShipment={handleSelectShipment}
                containerCounts={containerCounts}
              />
            </div>

            {/* Right side: Content Area - Takes 3/4 width */}
            <div className="lg:col-span-3">
              {filteredShipments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 px-4 text-center border rounded-lg bg-muted/20 h-full">
                  <Package className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === "created" 
                      ? "No shipments created"
                      : activeTab === "price_requested"
                      ? "No price requests"
                      : activeTab === "priced"
                      ? "No quotes received"
                      : "No shipments accepted"}
                  </h3>
                  <p className="text-muted-foreground max-w-md">
                    {activeTab === "created"
                      ? "Get started by creating your first shipment using the form above."
                      : activeTab === "price_requested"
                      ? "Once you request pricing for a shipment, it will appear here."
                      : activeTab === "priced"
                      ? "Shipments awaiting transporter quotes will appear here once priced."
                      : "Your accepted shipments and their final quotes will be listed here."}
                  </p>
                </div>
              ) : activeTab === "priced" || activeTab === "accepted_by_shipper" ? (
                <PricedShipItemsTable activeShipmentId={activeShipmentId} />
              ) : (
                <ContainerAssignTable
                  columns={columns}
                  data={filteredContainers}
                  activeShipmentId={activeShipmentId}
                  onAssignContainer={handleAssignContainer}
                  onGetPrice={handleGetPrice}
                  onRequestPrice={handleRequestPrice}
                  shipmentStatus={activeShipment?.status}
                  isRequestingPrice={isRequestingPrice}
                />
              )}
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
