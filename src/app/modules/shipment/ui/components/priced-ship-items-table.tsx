"use client";

import React, { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShipperShipItems } from "@/app/modules/shipment/server/hooks/use-transporter-shipments";
import { useAcceptShip } from "@/app/modules/shipment/server/hooks/use-accept-ship";
import { useShipments } from "@/app/modules/shipment/server/hooks/use-shipments";
import {
  Package,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Info,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ShipperShipItemsItem, ShipItem } from "@/lib/zod/shipment.schema";
import type { Container } from "@/lib/zod/container.schema";
import { UploadedDocsCell } from "./uploaded-docs-cell";

interface PricedShipItemsTableProps {
  activeShipmentId: number | null;
}

// Helper function to format numbers with 2 decimal places
const formatPrice = (value: number): string => {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export function PricedShipItemsTable({
  activeShipmentId,
}: PricedShipItemsTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { data, isLoading, error } = useShipperShipItems({
    page,
    per_page: perPage,
    ship_id: activeShipmentId || undefined,
  });
  const { data: shipmentsData } = useShipments();
  const { mutate: acceptShip, isPending: isAccepting } = useAcceptShip();
  const [selectedTransporterIds, setSelectedTransporterIds] = useState<
    Set<number>
  >(new Set());
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [containersModalOpen, setContainersModalOpen] = useState(false);
  const [selectedTransporterGroup, setSelectedTransporterGroup] = useState<
    (typeof filteredTransporterGroups)[0] | null
  >(null);
  // Track accepted shipments (for immediate UI feedback) - must be before early returns
  const [acceptedShipIds, setAcceptedShipIds] = useState<Set<number>>(
    new Set(),
  );

  // Create a map of accepted shipment IDs
  const acceptedShipmentIds = new Set(
    shipmentsData?.items
      .filter((shipment) => shipment.status === "accepted_by_shipper")
      .map((shipment) => shipment.id) || [],
  );

  // Clear selections when active shipment changes
  useEffect(() => {
    setSelectedTransporterIds(new Set());
  }, [activeShipmentId]);

  const handleSelectTransporter = (transporterId: number) => {
    setSelectedTransporterIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(transporterId)) {
        newSet.delete(transporterId);
      } else {
        newSet.add(transporterId);
      }
      return newSet;
    });
  };

  // Get transporter groups data (defined early for use in handlers)
  const transporterGroups = data?.items || [];

  // Filter transporter groups by activeShipmentId (already filtered by API, but double-check)
  const filteredTransporterGroups = transporterGroups.filter(
    (group: ShipperShipItemsItem) => {
      if (!activeShipmentId) return true;
      return group.ship_items.some(
        (item: ShipItem) => item.ship_id === activeShipmentId,
      );
    },
  );

  // Helper function to check if transporter has any returning containers
  const hasReturningContainers = (group: ShipperShipItemsItem): boolean => {
    return group.ship_items.some((shipItem: ShipItem) =>
      shipItem.containers?.some(
        (container: Container) => container.is_returning === true,
      ),
    );
  };

  // Handle opening containers modal
  const handleOpenContainersModal = (
    group: (typeof filteredTransporterGroups)[0],
  ) => {
    setSelectedTransporterGroup(group);
    setContainersModalOpen(true);
  };

  // Get all containers from a transporter group
  const getAllContainersFromGroup = (
    group: (typeof filteredTransporterGroups)[0],
  ) => {
    const containers: Array<{
      id: number;
      container_number?: string;
      container_size?: string;
      container_type?: string;
      gross_weight?: number;
      gross_weight_unit?: string;
      is_returning?: boolean;
      status?: string;
      ship_item_id: number; // Add this to track which item it belongs to
    }> = [];
    group.ship_items.forEach((shipItem: ShipItem) => {
      if (Array.isArray(shipItem.containers)) {
        shipItem.containers.forEach(container => {
          containers.push({
            ...container,
            ship_item_id: shipItem.id
          });
        });
      }
    });

    return containers;
  };

  const handleSelectAll = () => {
    // Only select transporters that are not already accepted
    const selectableTransporters = filteredTransporterGroups.filter(
      () =>
        !acceptedShipIds.has(activeShipmentId ?? 0) &&
        !acceptedShipmentIds.has(activeShipmentId ?? 0),
    );

    if (selectedTransporterIds.size === selectableTransporters.length) {
      setSelectedTransporterIds(new Set());
    } else {
      setSelectedTransporterIds(
        new Set(
          selectableTransporters.map(
            (group: ShipperShipItemsItem) => group.transporter_id,
          ),
        ),
      );
    }
  };

  const handleAcceptSelected = () => {
    if (selectedTransporterIds.size > 0) {
      setAcceptDialogOpen(true);
    }
  };

  const confirmAccept = () => {
    if (selectedTransporterIds.size > 0 && activeShipmentId) {
      // Get all ship_item_ids from selected transporters
      const shipItemIds: number[] = [];
      filteredTransporterGroups.forEach((group: ShipperShipItemsItem) => {
        if (selectedTransporterIds.has(group.transporter_id)) {
          group.ship_items.forEach((item: ShipItem) => {
            shipItemIds.push(item.id);
          });
        }
      });

      // Close dialog optimistically
      setAcceptDialogOpen(false);

      // Mark this shipment as accepted optimistically
      setAcceptedShipIds((prev) => new Set(prev).add(activeShipmentId));

      // Clear selections
      const selectedIdsBackup = new Set(selectedTransporterIds);
      setSelectedTransporterIds(new Set());

      // Trigger the mutation with error handling
      acceptShip(
        {
          shipId: activeShipmentId,
          shipItemIds,
        },
        {
          onError: () => {
            // Rollback: restore dialog and remove from accepted set
            setAcceptDialogOpen(true);
            setSelectedTransporterIds(selectedIdsBackup);
            setAcceptedShipIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(activeShipmentId);
              return newSet;
            });
          },
        },
      );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Priced Shipments
          </CardTitle>
          <CardDescription>
            All priced shipments with transporter quotes
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
            Priced Shipments
          </CardTitle>
          <CardDescription>
            All priced shipments with transporter quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            Error loading priced shipments:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Calculate totals
  const totalTransporters = filteredTransporterGroups.length;

  if (filteredTransporterGroups.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Priced Shipments
          </CardTitle>
          <CardDescription>
            All priced shipments with transporter quotes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No priced shipments available.
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
            <Package className="h-5 w-5" />
            Transporter Quotes
          </CardTitle>
          <CardDescription>
            {totalTransporters} transporter quote
            {totalTransporters !== 1 ? "s" : ""} for shipment #
            {activeShipmentId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectedTransporterIds.size > 0 &&
                        selectedTransporterIds.size ===
                        filteredTransporterGroups.filter(
                          () =>
                            !acceptedShipIds.has(activeShipmentId ?? 0) &&
                            !acceptedShipmentIds.has(activeShipmentId ?? 0),
                        ).length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Number of Containers</TableHead>
                  <TableHead>Return Status</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransporterGroups.length > 0 ? (
                  filteredTransporterGroups.map(
                    (group: ShipperShipItemsItem) => {
                      const rowKey = `transporter-${group.transporter_id}`;

                      const isAccepted =
                        acceptedShipIds.has(activeShipmentId ?? 0) ||
                        acceptedShipmentIds.has(activeShipmentId ?? 0);

                      const isSelected = selectedTransporterIds.has(
                        group.transporter_id,
                      );
                      const hasReturning = hasReturningContainers(group);
                      // Note: Return fee calculation removed as it's not displayed

                      const containerCount = group.total_containers ?? 0;
                      const totalPrice = group.ship_items.reduce(
                        (sum, item) => sum + Number(item.computed_price || 0),
                        0,
                      );

                      const currency = group.currency ?? "ETB";

                      return (
                        <TableRow key={rowKey}>
                          {/* Checkbox */}
                          <TableCell>
                            {isAccepted ? (
                              <Checkbox checked={false} disabled />
                            ) : (
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleSelectTransporter(group.transporter_id)
                                }
                              />
                            )}
                          </TableCell>

                          {/* Number of Containers */}
                          <TableCell>
                            <button
                              onClick={() => handleOpenContainersModal(group)}
                              className="text-sm font-medium text-primary hover:underline cursor-pointer"
                            >
                              {containerCount} container
                              {containerCount !== 1 ? "s" : ""}
                            </button>
                          </TableCell>

                          {/* Return Status */}
                          <TableCell>
                            {hasReturning ? (
                              <div className="flex items-center gap-1.5">
                                <Badge
                                  variant="secondary"
                                  className="w-fit text-xs"
                                >
                                  Returning
                                </Badge>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                                    </TooltipTrigger>
                                    <TooltipContent
                                      side="left"
                                      className="max-w-xs"
                                    >
                                      <p className="text-sm">
                                        A flat fee of 10,000 ETB is added when
                                        at least 1 container is returning. This
                                        fee is included in the total price.
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </div>
                            ) : (
                              <Badge
                                variant="outline"
                                className="w-fit text-xs"
                              >
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
                            {isAccepted ? (
                              <Badge variant="secondary" className="gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Accepted
                              </Badge>
                            ) : (
                              <Badge variant="outline">Pending</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    },
                  )
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No quotes found for this shipment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Accept Selected Button */}
          {selectedTransporterIds.size > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAcceptSelected}
                disabled={isAccepting}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept Selected ({selectedTransporterIds.size} transporter
                {selectedTransporterIds.size !== 1 ? "s" : ""})
              </Button>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-4">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing {(page - 1) * perPage + 1} to{" "}
                  {Math.min(page * perPage, data.total)} of {data.total} results
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(1)}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1 px-2">
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Page {page} of {data.pages || 1}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= data.pages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(data.pages)}
                    disabled={page >= data.pages || isLoading}
                  >
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
                <Select
                  value={perPage.toString()}
                  onValueChange={(value) => {
                    setPerPage(Number(value));
                    setPage(1);
                  }}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-8 text-xs sm:text-sm w-[70px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accept Confirmation Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Selected Quotes</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept {selectedTransporterIds.size}{" "}
              selected transporter quote
              {selectedTransporterIds.size !== 1 ? "s" : ""}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will accept all ship items from the selected
              transporter{selectedTransporterIds.size !== 1 ? "s" : ""} for
              shipment #{activeShipmentId}.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAcceptDialogOpen(false);
              }}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAccept}
              disabled={isAccepting}
              className="gap-2"
            >
              {isAccepting ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Accept Quote
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Containers Detail Modal */}
      <Dialog open={containersModalOpen} onOpenChange={setContainersModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Container Details</DialogTitle>
            <DialogDescription>
              {selectedTransporterGroup && (
                <>
                  Showing{" "}
                  {getAllContainersFromGroup(selectedTransporterGroup).length}{" "}
                  container
                  {getAllContainersFromGroup(selectedTransporterGroup)
                    .length !== 1
                    ? "s"
                    : ""}{" "}
                  for this transporter
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTransporterGroup && (
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
                        <TableHead>Documents</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {getAllContainersFromGroup(selectedTransporterGroup).map(
                        (container, index) => (
                          <TableRow key={container.id || index}>
                            <TableCell className="font-medium">
                              {container.container_number || "-"}
                            </TableCell>
                            <TableCell>
                              {container.container_size === "twenty_feet"
                                ? "20ft"
                                : container.container_size === "forty_feet"
                                  ? "40ft"
                                  : container.container_size || "-"}
                            </TableCell>
                            <TableCell>
                              {container.container_type
                                ? container.container_type
                                  .charAt(0)
                                  .toUpperCase() +
                                container.container_type.slice(1)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {container.gross_weight
                                ? `${container.gross_weight} ${container.gross_weight_unit || "kg"}`
                                : "-"}
                            </TableCell>
                            <TableCell>
                              {container.is_returning ? (
                                <Badge
                                  variant="secondary"
                                  className="w-fit text-xs"
                                >
                                  Returning
                                </Badge>
                              ) : (
                                <Badge
                                  variant="outline"
                                  className="w-fit text-xs"
                                >
                                  One-way
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className="w-fit text-xs"
                              >
                                {container.status || "N/A"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <UploadedDocsCell
                                shipItems={[{ id: container.ship_item_id }]}
                                containerId={container.id}
                              />
                            </TableCell>
                          </TableRow>
                        ),
                      )}
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
