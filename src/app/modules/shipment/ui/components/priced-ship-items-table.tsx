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
import { Package, CheckCircle2, Eye, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Info } from "lucide-react";
import Link from "next/link";
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

export function PricedShipItemsTable({ activeShipmentId }: PricedShipItemsTableProps) {
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const { data, isLoading, error } = useShipperShipItems({ page, per_page: perPage });
  const { data: shipmentsData } = useShipments();
  const { mutate: acceptShip, isPending: isAccepting } = useAcceptShip();
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  // Track accepted shipments (for immediate UI feedback) - must be before early returns
  const [acceptedShipIds, setAcceptedShipIds] = useState<Set<number>>(new Set());
  
  // Create a map of accepted shipment IDs
  const acceptedShipmentIds = new Set(
    shipmentsData?.items
      .filter((shipment) => shipment.status === "accepted_by_shipper")
      .map((shipment) => shipment.id) || []
  );

  // Clear selections when active shipment changes
  useEffect(() => {
    setSelectedItemIds(new Set());
  }, [activeShipmentId]);

  const handleSelectItem = (itemId: number) => {
    setSelectedItemIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    // Only select items that are not already accepted
    const selectableItems = filteredItems.filter(
      (item) => !acceptedShipIds.has(item.ship_id) && !acceptedShipmentIds.has(item.ship_id)
    );
    
    if (selectedItemIds.size === selectableItems.length) {
      setSelectedItemIds(new Set());
    } else {
      setSelectedItemIds(new Set(selectableItems.map((item) => item.id)));
    }
  };

  const handleAcceptSelected = () => {
    if (selectedItemIds.size > 0) {
      setAcceptDialogOpen(true);
    }
  };

  const confirmAccept = () => {
    if (selectedItemIds.size > 0 && activeShipmentId) {
      // Get the ship_item_ids from selected items
      const shipItemIds = Array.from(selectedItemIds);
      
      // Close dialog optimistically
      setAcceptDialogOpen(false);
      
      // Mark this shipment as accepted optimistically
      setAcceptedShipIds((prev) => new Set(prev).add(activeShipmentId));
      
      // Clear selections
      const selectedIdsBackup = new Set(selectedItemIds);
      setSelectedItemIds(new Set());
      
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
            setSelectedItemIds(selectedIdsBackup);
            setAcceptedShipIds((prev) => {
              const newSet = new Set(prev);
              newSet.delete(activeShipmentId);
              return newSet;
            });
          },
        }
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
            Error loading priced shipments: {error instanceof Error ? error.message : "Unknown error"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const transporterGroups = data?.items || [];

  // Flatten all ship items and filter by activeShipmentId
  const allShipItems = transporterGroups.flatMap((group) =>
    group.ship_items
      .filter((item) => !activeShipmentId || item.ship_id === activeShipmentId)
      .map((item) => ({
        ...item,
        transporter_id: group.transporter_id,
        group_currency: group.currency,
      }))
  );

  // Group ship items by transporter since we filtered by ship_id
  const filteredItems = allShipItems.sort((a, b) => a.id - b.id);

  // Calculate totals
  const totalTransporters = transporterGroups.length;
  const totalShipItems = allShipItems.length;
  const totalContainers = transporterGroups.reduce(
    (sum, group) => sum + group.total_containers,
    0
  );
  const totalPrice = transporterGroups.reduce(
    (sum, group) => sum + group.total_price,
    0
  );
  const primaryCurrency = transporterGroups[0]?.currency || "ETB";

  if (transporterGroups.length === 0) {
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
            {filteredItems.length} transporter quote{filteredItems.length !== 1 ? "s" : ""} for shipment #{activeShipmentId}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={selectedItemIds.size > 0 && selectedItemIds.size === filteredItems.filter(
                        (item) => !acceptedShipIds.has(item.ship_id) && !acceptedShipmentIds.has(item.ship_id)
                      ).length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Container Numbers</TableHead>
                  <TableHead>Return Status</TableHead>
                  <TableHead className="text-right">Base Price</TableHead>
                  <TableHead className="text-right">Return Fee</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => {
                    const containerCount = Array.isArray(item.containers) ? item.containers.length : 0;
                    const containers = Array.isArray(item.containers) ? item.containers : [];
                    const returningCount = containers.filter((c) => c.is_returning === true).length;
                    const notReturningCount = containerCount - returningCount;
                    const rowKey = `${item.transporter_id}-${item.id}`;
                    const isAccepted = acceptedShipIds.has(item.ship_id) || acceptedShipmentIds.has(item.ship_id);
                    const isSelected = selectedItemIds.has(item.id);
                    
                    // Calculate return fee: 10,000 ETB per returning container
                    const RETURN_FEE_PER_CONTAINER_ETB = 10000;
                    const returnFeeETB = returningCount * RETURN_FEE_PER_CONTAINER_ETB;
                    // Ensure basePrice is a number (API might return string)
                    const basePrice = item.computed_price !== undefined && item.computed_price !== null 
                      ? Number(item.computed_price) 
                      : 0;
                    const currency = item.currency || item.group_currency || "ETB";
                    // Calculate total: base price plus return fee if there are returning containers
                    const totalPrice = basePrice + returnFeeETB;

                    return (
                      <TableRow key={rowKey}>
                        {/* Checkbox */}
                        <TableCell>
                          {isAccepted ? (
                            <Checkbox checked={false} disabled />
                          ) : (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleSelectItem(item.id)}
                            />
                          )}
                        </TableCell>
                        {/* Container Numbers */}
                        <TableCell>
                          {containerCount > 0 ? (
                            <span className="text-sm font-medium">
                              {containerCount} container{containerCount !== 1 ? "s" : ""}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">0 containers</span>
                          )}
                        </TableCell>
                        {/* Return Status */}
                        <TableCell>
                          {containerCount > 0 ? (
                            <div className="flex flex-col gap-1">
                              {returningCount > 0 && (
                                <Badge variant="secondary" className="w-fit text-xs">
                                  Returning
                                </Badge>
                              )}
                              {notReturningCount > 0 && (
                                <Badge variant="outline" className="w-fit text-xs">
                                  One-way
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </TableCell>
                        {/* Base Price */}
                        <TableCell className="text-right">
                          <span className="font-medium">
                            {formatPrice(basePrice)}
                          </span>
                        </TableCell>
                        {/* Return Fee */}
                        <TableCell className="text-right">
                          {returnFeeETB > 0 ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <span className="text-amber-600 font-medium">
                                {formatPrice(returnFeeETB)}
                              </span>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground cursor-help" />
                                  </TooltipTrigger>
                                  <TooltipContent side="left" className="max-w-xs">
                                    <div className="space-y-1.5">
                                      <p className="font-semibold">Return Fee Details:</p>
                                      <div className="space-y-1 text-xs">
                                        <div className="flex justify-between gap-4">
                                          <span>Returning Containers:</span>
                                          <span>{returningCount} container{returningCount !== 1 ? "s" : ""}</span>
                                        </div>
                                        <div className="flex justify-between gap-4">
                                          <span>Fee per Container:</span>
                                          <span>10,000.00 ETB</span>
                                        </div>
                                        <div className="flex justify-between gap-4 pt-1 border-t border-border font-semibold">
                                          <span>Total Return Fee:</span>
                                          <span>{formatPrice(returnFeeETB)} ETB</span>
                                        </div>
                                      </div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        {/* Total */}
                        <TableCell className="text-right">
                          <span className="font-semibold">
                            {formatPrice(totalPrice)}
                          </span>
                        </TableCell>
                        {/* Currency */}
                        <TableCell>{item.currency || item.group_currency || "ETB"}</TableCell>
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
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                      No quotes found for this shipment.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Accept Selected Button */}
          {selectedItemIds.size > 0 && (
            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAcceptSelected}
                disabled={isAccepting}
                className="gap-2"
              >
                <CheckCircle2 className="h-4 w-4" />
                Accept Selected ({selectedItemIds.size})
              </Button>
            </div>
          )}

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t mt-4">
              <div className="flex items-center gap-2">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Showing {((page - 1) * perPage) + 1} to {Math.min(page * perPage, data.total)} of {data.total} results
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
              Are you sure you want to accept {selectedItemIds.size} selected quote{selectedItemIds.size !== 1 ? "s" : ""}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              This action will accept the selected transporter quotes for shipment #{activeShipmentId}.
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
    </>
  );
}
