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
import { useCompleteShipItem } from "@/app/modules/shipment/server/hooks/use-complete-ship-item";
import { UploadedDocsCell } from "@/app/modules/shipment/ui/components/uploaded-docs-cell";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Info, CheckCircle2, Loader2 } from "lucide-react";
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

export function AcceptedShipItemsTable({
  activeShipmentId,
}: AcceptedShipItemsTableProps) {
  const {
    data: acceptedShipItems,
    isLoading,
    error,
  } = useAcceptedShipItems(activeShipmentId);
  const [containersModalOpen, setContainersModalOpen] = useState(false);
  const [selectedShipItem, setSelectedShipItem] = useState<
    (typeof transporterGroups)[0] | null
  >(null);
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  const completeMutation = useCompleteShipItem(activeShipmentId);

  // Group ship items by transporter
  const transporterGroups = React.useMemo(() => {
    if (!acceptedShipItems) return [];
    const groups = new Map<
      number,
      {
        transporter_id: number;
        transporter: { id: number; name?: string } | null;
        ship_items: Array<{
          id: number;
          transporter_id: number;
          containers?: Array<{ id: number; is_returning?: boolean }>;
          computed_price: number;
          currency: string;
        }>;
        total_price: number;
        total_containers: number;
        currency: string;
      }
    >();
    acceptedShipItems.forEach((item) => {
      const transporterId = item.transporter_id;
      if (!groups.has(transporterId)) {
        groups.set(transporterId, {
          transporter_id: transporterId,
          transporter:
            (item.transporter as { id: number; name?: string } | null) ?? null,
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

  const hasReturningContainers = (
    group: (typeof transporterGroups)[0],
  ): boolean =>
    group.ship_items.some((si) =>
      si.containers?.some((c) => c.is_returning === true),
    );

  const handleOpenContainersModal = (group: (typeof transporterGroups)[0]) => {
    setSelectedShipItem(group);
    setContainersModalOpen(true);
  };

  const selectedShipItemIds = React.useMemo(
    () =>
      transporterGroups
        .filter((g) => selectedRowIds.has(g.transporter_id))
        .flatMap((g) => g.ship_items.map((si) => si.id)),
    [transporterGroups, selectedRowIds],
  );

  const toggleRow = (transporterId: number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(transporterId)) next.delete(transporterId);
      else next.add(transporterId);
      return next;
    });
  };

  const allRowsSelected =
    transporterGroups.length > 0 &&
    transporterGroups.every((g) => selectedRowIds.has(g.transporter_id));
  const toggleSelectAll = () => {
    if (allRowsSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(
        new Set(transporterGroups.map((g) => g.transporter_id)),
      );
    }
  };

  const handleCompleteSelected = async () => {
    if (selectedShipItemIds.length === 0) return;
    for (const id of selectedShipItemIds) {
      await completeMutation.mutateAsync(id);
    }
    setSelectedRowIds(new Set());
  };

  const getAllContainersFromGroup = (group: (typeof transporterGroups)[0]) => {
    const containers: Array<{
      id: number;
      container_number?: string;
      container_size?: string;
      container_type?: string;
      gross_weight?: number;
      gross_weight_unit?: string;
      is_returning?: boolean;
      status?: string;
    }> = [];
    group.ship_items.forEach((si) => {
      if (si.containers && Array.isArray(si.containers)) {
        containers.push(...si.containers);
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
            Error loading accepted ship items:{" "}
            {error instanceof Error ? error.message : "Unknown error"}
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
            Accepted ship items for this shipment
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Accepted Ship Items
              </CardTitle>
              <CardDescription>
                {transporterGroups.length} accepted transporter quote
                {transporterGroups.length !== 1 ? "s" : ""} for shipment #
                {activeShipmentId}
              </CardDescription>
            </div>
            {selectedShipItemIds.length > 0 && (
              <Button
                onClick={handleCompleteSelected}
                disabled={completeMutation.isPending}
              >
                {completeMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Completing…
                  </>
                ) : (
                  "Complete"
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allRowsSelected}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all rows"
                    />
                  </TableHead>
                  <TableHead>Number of Containers</TableHead>
                  <TableHead>Return Status</TableHead>
                  <TableHead className="text-right">Total Price</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Uploaded docs</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transporterGroups.map((group) => {
                  const rowKey = `transporter-${group.transporter_id}`;
                  const hasReturning = hasReturningContainers(group);
                  const totalPrice = group.total_price || 0;
                  const currency = group.currency || "ETB";
                  const containerCount = group.total_containers || 0;

                  return (
                    <TableRow key={rowKey}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedRowIds.has(group.transporter_id)}
                          onCheckedChange={() =>
                            toggleRow(group.transporter_id)
                          }
                          aria-label={`Select transporter ${group.transporter_id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleOpenContainersModal(group)}
                          className="text-sm font-medium text-primary hover:underline cursor-pointer"
                        >
                          {containerCount} container
                          {containerCount !== 1 ? "s" : ""}
                        </button>
                      </TableCell>
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
                                    A flat fee of 10,000 ETB is added when at
                                    least 1 container is returning. This fee is
                                    included in the total price.
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
                      <TableCell className="text-right">
                        <span className="font-semibold">
                          {formatPrice(totalPrice)}
                        </span>
                      </TableCell>
                      <TableCell>{currency}</TableCell>
                      <TableCell>
                        <UploadedDocsCell shipItems={group.ship_items} />
                      </TableCell>
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
                <>
                  Showing {getAllContainersFromGroup(selectedShipItem).length}{" "}
                  container
                  {getAllContainersFromGroup(selectedShipItem).length !== 1
                    ? "s"
                    : ""}{" "}
                  for this transporter
                </>
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
                      {selectedShipItem &&
                        getAllContainersFromGroup(selectedShipItem).map(
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
                            <Badge variant="outline" className="w-fit text-xs">
                              {container.status || "N/A"}
                            </Badge>
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
