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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package } from "lucide-react";
import { PricedShipItemsTable } from "@/app/modules/shipment/ui/components/priced-ship-items-table";
import { AcceptedShipItemsTable } from "@/app/modules/shipment/ui/components/accepted-ship-items-table";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function ShipmentsView() {
  const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>("created");
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Fetch data
  const { data: shipmentsResponse, isLoading: shipmentsLoading } =
    useShipments();

  const allShipments = useMemo(
    () => shipmentsResponse?.items || [],
    [shipmentsResponse?.items],
  );

  // Filter shipments by status based on active tab
  const filteredShipments = useMemo(
    () => allShipments.filter((s) => s.status === activeTab),
    [allShipments, activeTab],
  );

  // Auto-select first shipment when filtered list changes
  useEffect(() => {
    if (filteredShipments.length > 0) {
      // Only auto-select if current activeShipmentId is not in the filtered list
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

  // Handle get price
  const handleGetPrice = (containerIds: number[]) => {
    if (!activeShipmentId || containerIds.length === 0) return;
    getPrice({ shipmentId: activeShipmentId, containerIds });
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
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? "Cancel" : "Create Shipment"}
          </Button>
        </div>

        {/* Create Shipment Form - Conditionally rendered */}
        {showCreateForm && (
          <Card className="border shadow-sm">
            <CardContent className="p-6">
              <CreateShipmentForm onSuccess={handleShipmentCreated} />
            </CardContent>
          </Card>
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
              />
            </CardContent>
          </Card>
        </div>

        {/* Right side: Tabs + Content Area - Takes 3/4 width on desktop, full width on mobile */}
        <div className="lg:col-span-3">
          <div className="bg-card rounded-xl border p-1 shadow-sm">
            <Tabs
              defaultValue="created"
              onValueChange={setActiveTab}
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
                    className="flex items-center justify-center gap-2 py-2.5 px-3 data-[state=active]:bg-background data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-border rounded-md transition-all duration-200"
                  >
                    <span className="font-medium text-sm">Priced</span>
                    <Badge
                      variant="secondary"
                      className="ml-1 h-6 min-w-6 justify-center px-1.5 font-medium"
                    >
                      {allShipments.filter((s) => s.status === "priced").length}
                    </Badge>
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
