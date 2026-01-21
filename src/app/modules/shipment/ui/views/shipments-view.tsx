"use client";

import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, MapPin, Calendar, FileText, ChevronRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export function ShipmentsView() {
  const [activeShipmentId, setActiveShipmentId] = useState<number | null>(null);
  const [selectedContainers, setSelectedContainers] = useState<number[]>([]);

  // Fetch data
  const { data: shipmentsResponse, isLoading: shipmentsLoading } = useShipments();
  
  const shipments = shipmentsResponse?.items || [];

  // Auto-select first shipment when shipments load and no shipment is selected
  useEffect(() => {
    if (shipments.length > 0 && activeShipmentId === null) {
      setActiveShipmentId(shipments[0].id);
    }
  }, [shipments, activeShipmentId]);
  
  // Fetch containers assigned to the active shipment (only when activeShipmentId is set)
  const { data: assignedContainersData, isLoading: assignedContainersLoading } = useContainers(
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
  const { mutate: requestPrice, isPending: isRequestingPrice } = useRequestPrice();
  
  // Get active shipment status
  const activeShipment = shipments.find(s => s.id === activeShipmentId);

  // Get assigned container IDs for active shipment (for column actions)
  const assignedContainerIds = assignedContainers.map((c) => c.id);

  // Handle container assignment
  const handleAssignContainer = (containerId: number) => {
    if (!activeShipmentId) return;
    assignContainers({ shipmentId: activeShipmentId, containerIds: [containerId] });
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
      setSelectedContainers([]); // Clear selection when switching shipments
    }
  };

  // Clear selection when switching shipments
  const handleSelectShipment = (shipmentId: number) => {
    setActiveShipmentId(shipmentId);
    setSelectedContainers([]); // Clear selection
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
    selectedContainers,
    onSelectionChange: setSelectedContainers,
    data: filteredContainers,
  });

  // Loading state - only show skeleton on initial load, not on refetch
  if (shipmentsLoading && !shipments.length) {
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
    <div className="min-h-screen  p-6 space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Shipment Management</h1>
  <p className="text-gray-600 dark:text-gray-300">Create and manage your shipments, assign containers, and track progress</p>
</div>

      {/* Create Shipment Card */}
      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-xl">
            <Package className="h-5 w-5 text-blue-600" />
            Create New Shipment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CreateShipmentForm onSuccess={handleShipmentCreated} />
        </CardContent>
      </Card>

      {/* Main Content Section - Sidebar on left, content on right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Shipment Sidebar - Takes 1/4 width on left, starts from top */}
        <div className="lg:col-span-1">
          <div className="sticky top-6"> {/* Make it stick when scrolling */}
            <Card className="border-gray-200 shadow-sm h-[calc(100vh-8rem)] flex flex-col">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  Active Shipments
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {shipments.length} shipment{shipments.length !== 1 ? 's' : ''} total
                </p>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-0">
                <div className="p-4">
                  <ShipmentSidebar
                    shipments={shipments}
                    activeShipmentId={activeShipmentId}
                    onSelectShipment={handleSelectShipment}
                    containerCounts={containerCounts}
                  />
                </div>
              </CardContent>
             
            </Card>
          </div>
        </div>

        {/* Main Content Area - Takes 3/4 width on right */}
        <div className="lg:col-span-3 space-y-8">
          {/* Documents Card */}
          {activeShipmentId && (
            <Card className="border-gray-200 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Shipment Documents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ShipmentDocumentsCard shipId={activeShipmentId} />
              </CardContent>
            </Card>
          )}

          {/* Container Assignment Card */}
          <Card className="border-gray-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Package className="h-5 w-5 text-green-600" />
                Container Assignment
              </CardTitle>
              <p className="text-sm text-gray-600">
                {activeShipmentId 
                  ? "Search and assign available containers to this shipment" 
                  : "Select a shipment from the left to assign containers"}
              </p>
            </CardHeader>
            <CardContent>
              <ContainerAssignTable
                columns={columns}
                data={filteredContainers}
                activeShipmentId={activeShipmentId}
                onAssignContainer={handleAssignContainer}
                selectedContainers={selectedContainers}
                onSelectionChange={setSelectedContainers}
                onGetPrice={handleGetPrice}
                onRequestPrice={handleRequestPrice}
                shipmentStatus={activeShipment?.status}
                isRequestingPrice={isRequestingPrice}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}