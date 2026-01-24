"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAcceptedShipItems } from "@/app/modules/shipment/server/hooks/use-accepted-ship-items";
import { Package, Info, CheckCircle2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AcceptedShipItemsTableProps {
  activeShipmentId: number | null;
}

// Helper function to format numbers with 2 decimal places
const formatPrice = (value: number): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function AcceptedShipItemsTable({ activeShipmentId }: AcceptedShipItemsTableProps) {
  const { data: acceptedShipItems, isLoading, error } = useAcceptedShipItems(activeShipmentId);
  const [containersModalOpen, setContainersModalOpen] = useState(false);
  const [selectedShipItem, setSelectedShipItem] = useState<any>(null);

  // Group ship items by transporter
  const transporterGroups = React.useMemo(() => {
    if (!acceptedShipItems) return [];
    
    const groups = new Map<number, {
      transporter_id: number;
      transporter: any;
      ship_items: any[];
      total_price: number;
      total_containers: number;
      currency: string;
    }>();

    acceptedShipItems.forEach((item) => {
      const transporterId = item.transporter_id;
      
      if (!groups.has(transporterId)) {
        groups.set(transporterId, {
          transporter_id: transporterId,
          transporter: item.transporter,
          ship_items: [],
          total_price: 0,
          total_containers: 0,
          currency: item.currency || "ETB",
        });
      }

      const group = groups.get(transporterId)!;
      group.ship_items.push(item);
      group.total_price += Number(item.computed_price) || 0;
      group.total_containers += item.containers?.length || 0;
    });

    return Array.from(groups.values());
  }, [acceptedShipItems]);

  // Helper function to check if transporter has any returning containers
  const hasReturningContainers = (group: typeof transporterGroups[0]): boolean => {
    return group.ship_items.some((shipItem) => 
      shipItem.containers?.some((container: any) => container.is_returning === true)
    );
  };

  // Handle opening containers modal
  const handleOpenContainersModal = (group: typeof transporterGroups[0]) => {
    setSelectedShipItem(group);
    setContainersModalOpen(true);
  };

  // Get all containers from a transporter group
  const getAllContainersFromGroup = (group: typeof transporterGroups[0]) => {
    const containers: any[] = [];
    group.ship_items.forEach((shipItem) => {
      if (shipItem.containers && Array.isArray(shipItem.containers)) {
        containers.push(...shipItem.containers);
      }
    });
    return containers;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Accepted Ship Items
          </CardTitle>
          <CardDescription>
            Accepted transporter quotes for this shipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Accepted Ship Items
          </CardTitle>
          <CardDescription>
            Accepted transporter quotes for this shipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading accepted ship items: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!activeShipmentId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Accepted Ship Items
          </CardTitle>
          <CardDescription>
            Accepted transporter quotes for this shipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            Select a shipment to view accepted ship items.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (transporterGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Accepted Ship Items
          </CardTitle>
          <CardDescription>
            Accepted transporter quotes for this shipment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No accepted ship items found for this shipment.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Accepted Ship Items
          </CardTitle>
          <CardDescription>
            {transporterGroups.length} accepted transporter quote{transporterGroups.length !== 1 ? "s" : ""} for shipment #{activeShipmentId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number of Containers</TableHead>
                  <TableHead>Return Status</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transporterGroups.map((group) => {
                  const rowKey = `transporter-${group.transporter_id}`;
                  const hasReturning = hasReturningContainers(group);
                  
                  // Calculate returning containers count and return fee
                  const RETURN_FEE_ETB = 10000;
                  const returningContainers = group.ship_items.reduce((count, shipItem) => {
                    return count + (shipItem.containers?.filter((c: any) => c.is_returning === true).length || 0);
                  }, 0);
                  const returnFeeETB = returningContainers > 0 ? RETURN_FEE_ETB : 0;
                  
                  // Ensure total_price is a number
                  const totalPrice = group.total_price || 0;
                  const currency = group.currency || "ETB";
                  const containerCount = group.total_containers || 0;

                  return (
                    <TableRow key={rowKey}>
                      {/* Number of Containers */}
                      <TableCell>
                        <button
                          onClick={() => handleOpenContainersModal(group)}
                          className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                          {containerCount} container{containerCount !== 1 ? "s" : ""}
                        </button>
                      </TableCell>
                      {/* Return Status */}
                      <TableCell>
                        {hasReturning ? (
                          <div className="flex items-center gap-1.5">
                            <Badge variant="secondary" className="w-fit text-xs">
                              Returning
                            </Badge>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs">
                                  <p className="text-sm">
                                    A flat fee of 10,000 ETB is added when at least 1 container is returning. This fee is included in the total price.
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <Badge variant="outline" className="w-fit text-xs">
                            One-way
                          </Badge>
                        )}
                      </TableCell>
                      {/* Total Price */}
                      <TableCell className="text-right">
                        <span className="font-semibold">
                          {formatPrice(totalPrice)}
                        </span>
                      </TableCell>
                      {/* Currency */}
                      <TableCell>{currency}</TableCell>
                      {/* Status */}
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Accepted
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Containers Detail Modal */}
      <Dialog open={containersModalOpen} onOpenChange={setContainersModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Container Details</DialogTitle>
            <DialogDescription>
              {selectedShipItem && (
                <>Showing {getAllContainersFromGroup(selectedShipItem).length} container{getAllContainersFromGroup(selectedShipItem).length !== 1 ? "s" : ""} for this transporter</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedShipItem && (
              <div className="space-y-4">
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Container Number</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Return Status</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAllContainersFromGroup(selectedShipItem).map((container, index) => (
                        <TableRow key={container.id || index}>
                          <TableCell className="font-medium">
                            {container.container_number || "-"}
                          </TableCell>
                          <TableCell>
                            {container.container_size === "twenty_feet" ? "20ft" : container.container_size === "forty_feet" ? "40ft" : container.container_size || "-"}
                          </TableCell>
                          <TableCell>
                            {container.container_type ? container.container_type.charAt(0).toUpperCase() + container.container_type.slice(1) : "-"}
                          </TableCell>
                          <TableCell>
                            {container.gross_weight ? `${container.gross_weight} ${container.gross_weight_unit || "kg"}` : "-"}
                          </TableCell>
                          <TableCell>
                            {container.is_returning ? (
                              <Badge variant="secondary" className="w-fit text-xs">
                                Returning
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="w-fit text-xs">
                                One-way
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="w-fit text-xs">
                              {container.status || "N/A"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setContainersModalOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

