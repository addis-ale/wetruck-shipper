"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useShipperShipItems } from "@/app/modules/shipment/server/hooks/use-transporter-shipments";
import { useAcceptShip } from "@/app/modules/shipment/server/hooks/use-accept-ship";
import { useShipItemDetail } from "@/app/modules/shipment/server/hooks/use-ship-item-detail";
import { useShipment } from "@/app/modules/shipment/server/hooks/use-shipment";
import { 
  CheckCircle2, 
  ChevronRight, 
  Package, 
  Truck,
  Box
} from "lucide-react";
import Link from "next/link";

// Component to render each quote card with detailed information
function QuoteCard({ 
  quoteItem, 
  onAccept, 
  isAccepting,
  isAccepted
}: { 
  quoteItem: any; 
  onAccept: (item: any) => void; 
  isAccepting: boolean;
  isAccepted: boolean;
}) {
  const { data: detailedItem, isLoading: isLoadingDetail } = useShipItemDetail(quoteItem.id);
  
  // Use detailed data if available, otherwise fall back to quoteItem
  const displayItem = detailedItem || quoteItem;
  const quoteContainerCount = Array.isArray(displayItem.containers)
    ? displayItem.containers.length
    : 0;

  return (
    <Card className="border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Transporter #{displayItem.transporter_id}</CardTitle>
              <CardDescription>
                {quoteContainerCount} container{quoteContainerCount !== 1 ? "s" : ""}
              </CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="text-lg px-3 py-1">
            {displayItem.computed_price?.toLocaleString() || "0"} {displayItem.currency || "ETB"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoadingDetail ? (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <>
            {displayItem.containers && displayItem.containers.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Box className="h-4 w-4" />
                  Containers
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Number</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Weight</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayItem.containers.map((container: any) => (
                        <TableRow key={container.id}>
                          <TableCell className="font-medium">
                            {container.container_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="capitalize">
                              {container.container_size?.replace(/_/g, " ") || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {container.container_type || "N/A"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {container.gross_weight ? (
                              <span>
                                {container.gross_weight} {container.gross_weight_unit || "kg"}
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No containers assigned</p>
              </div>
            )}
            <Separator />
            {isAccepted ? (
              <Button
                disabled
                variant="secondary"
                className="w-full bg-muted text-muted-foreground"
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Accepted
              </Button>
            ) : (
              <Button
                onClick={() => onAccept(displayItem)}
                disabled={isAccepting}
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isAccepting ? "Accepting..." : "Accept Quote"}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ShipmentQuotesDetailView({ shipId }: { shipId: number }) {
  const { data, isLoading, error } = useShipperShipItems();
  const { mutate: acceptShip, isPending: isAccepting } = useAcceptShip();
  const { data: shipment } = useShipment(shipId);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  
  // Check if shipment is already accepted
  const isShipmentAccepted = shipment?.status === "accepted_by_shipper";

  // Find the group for this shipId
  const shipGroup = data?.items
    .flatMap((item) =>
      item.ship_items.map((shipItem) => ({
        ...shipItem,
        transporter_id: item.transporter_id,
        group_currency: item.currency,
      }))
    )
    .filter((item) => item.ship_id === shipId)
    .reduce(
      (acc, item) => {
        if (!acc.transporters.includes(item.transporter_id)) {
          acc.transporters.push(item.transporter_id);
        }
        acc.items.push(item);
        return acc;
      },
      { shipId, transporters: [] as number[], items: [] as any[] }
    );

  // Calculate total containers across all quotes
  const totalContainers = shipGroup?.items.reduce((sum, item) => {
    const count = Array.isArray(item.containers) ? item.containers.length : 0;
    return sum + count;
  }, 0) || 0;

  const handleAccept = (item: any) => {
    setSelectedItem(item);
    setAcceptDialogOpen(true);
  };

  const confirmAccept = () => {
    if (selectedItem) {
      // Store values before clearing
      const shipIdToAccept = selectedItem.ship_id || shipId;
      const shipItemIdToAccept = selectedItem.id;
      const itemToRestore = { ...selectedItem }; // Store a copy for rollback
      
      // Close dialog optimistically
      setAcceptDialogOpen(false);
      setSelectedItem(null);
      
      // Trigger the mutation with error handling
      acceptShip(
        {
          shipId: shipIdToAccept,
          shipItemIds: [shipItemIdToAccept],
        },
        {
          onError: () => {
            // Rollback: restore dialog
            setAcceptDialogOpen(true);
            setSelectedItem(itemToRestore);
          },
        }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !shipGroup || shipGroup.items.length === 0) {
    return (
      <div className="space-y-6">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link
            href="/dashboard/shipments/priced"
            className="hover:text-foreground transition-colors"
          >
            Priced Shipments
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">Shipment #{shipId} - Quotes</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Shipment #{shipId} - Quotes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error
                ? "Error loading quotes. Please try again."
                : "No quotes found for this shipment."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link
          href="/dashboard/shipments/accepted"
          className="hover:text-foreground transition-colors"
        >
          Accepted Shipments
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="text-foreground font-medium">Shipment #{shipId} - Quotes</span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          Shipment #{shipId} - Quotes
        </h1>
        <p className="text-muted-foreground mt-1">
          Review and accept quotes from transporters for this shipment
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Quotes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shipGroup.items.length}</p>
                <p className="text-xs text-muted-foreground">Available quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Transporters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shipGroup.transporters.length}</p>
                <p className="text-xs text-muted-foreground">Different transporters</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Containers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Box className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalContainers}</p>
                <p className="text-xs text-muted-foreground">Containers across all quotes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Section */}
      <Card>
        <CardHeader>
          <CardTitle>Transporter Quotes</CardTitle>
          <CardDescription>
            Compare quotes from different transporters and accept the best offer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shipGroup.items.map((quoteItem) => {
              return (
                <QuoteCard 
                  key={quoteItem.id} 
                  quoteItem={quoteItem} 
                  onAccept={handleAccept} 
                  isAccepting={isAccepting}
                  isAccepted={isShipmentAccepted}
                />
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Accept Confirmation Dialog */}
      <Dialog open={acceptDialogOpen} onOpenChange={setAcceptDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Accept Quote</DialogTitle>
            <DialogDescription>
              Are you sure you want to accept this quote from Transporter #
              {selectedItem?.transporter_id}?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold text-lg">
                  {selectedItem?.computed_price?.toLocaleString() || "0"}{" "}
                  {selectedItem?.currency || "ETB"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Containers:</span>
                <span className="font-semibold">
                  {selectedItem?.containers?.length || 0}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAcceptDialogOpen(false)}
              disabled={isAccepting}
            >
              Cancel
            </Button>
            <Button onClick={confirmAccept} disabled={isAccepting}>
              {isAccepting ? "Accepting..." : "Accept Quote"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
