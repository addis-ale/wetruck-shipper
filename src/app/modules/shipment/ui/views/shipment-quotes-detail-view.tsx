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
import { useTranslation } from "react-i18next";

// Component to render each quote card with detailed information
function QuoteCard({ 
  quoteItem, 
  onAccept, 
  isAccepting,
  isAccepted
}: { 
  quoteItem: { id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }; 
  onAccept: (item: { id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }) => void; 
  isAccepting: boolean;
  isAccepted: boolean;
}) {
  const { t } = useTranslation(["shipment", "common"]);
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
              <CardTitle className="text-lg">{t("shipment:quotes.transporter", { id: displayItem.transporter_id })}</CardTitle>
              <CardDescription>
                {t("shipment:quotes.containers_count", { count: quoteContainerCount })}
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
                  {t("shipment:containers.title")}
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t("common:labels.number")}</TableHead>
                        <TableHead>{t("common:labels.size")}</TableHead>
                        <TableHead>{t("common:labels.type")}</TableHead>
                        <TableHead className="text-right">{t("common:labels.weight")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayItem.containers.map((container) => (
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
                <p className="text-sm">{t("shipment:containers.no_assigned")}</p>
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
                {t("common:status.accepted")}
              </Button>
            ) : (
              <Button
                onClick={() => onAccept(displayItem)}
                disabled={isAccepting}
                className="w-full"
                size="lg"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isAccepting ? t("shipment:quotes.accepting") : t("shipment:quotes_detail.accept_quote")}
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export function ShipmentQuotesDetailView({ shipId }: { shipId: number }) {
  const { t } = useTranslation(["shipment", "common"]);
  const { data, isLoading, error } = useShipperShipItems({ ship_id: shipId });
  const { mutate: acceptShip, isPending: isAccepting } = useAcceptShip();
  const { data: shipment } = useShipment(shipId);
  const [acceptDialogOpen, setAcceptDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number }> } | null>(null);
  
  // Check if shipment is already accepted
  const isShipmentAccepted = shipment?.status === "accepted_by_shipper";

  // Find the group for this shipId
  const shipGroup = data?.items
    .flatMap((item: { transporter_id: number; ship_items: Array<{ ship_id: number; id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }>; currency: string }) =>
      item.ship_items.map((shipItem: { ship_id: number; id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }) => ({
        ...shipItem,
        transporter_id: item.transporter_id,
        group_currency: item.currency,
      }))
    )
    .filter((item: { ship_id: number }) => item.ship_id === shipId)
    .reduce(
      (acc: { shipId: number; transporters: number[]; items: Array<{ id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }> }, item: { id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }) => {
        if (!acc.transporters.includes(item.transporter_id)) {
          acc.transporters.push(item.transporter_id);
        }
        acc.items.push(item);
        return acc;
      },
      { shipId, transporters: [] as number[], items: [] as Array<{ id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }> }
    );

  // Calculate total containers across all quotes
  const totalContainers = shipGroup?.items.reduce((sum: number, item: { containers?: Array<{ id: number }> }) => {
    const count = Array.isArray(item.containers) ? item.containers.length : 0;
    return sum + count;
  }, 0) || 0;

  const handleAccept = (item: { id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number }> }) => {
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
            {t("shipment:quotes_detail.priced_shipments")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{t("shipment:quotes_detail.title", { id: shipId })}</span>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("shipment:quotes_detail.title", { id: shipId })}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error
                ? t("shipment:quotes_detail.error_loading")
                : t("shipment:quotes_detail.no_quotes")}
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
            {t("shipment:quotes_detail.accepted_shipments")}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-medium">{t("shipment:quotes_detail.title", { id: shipId })}</span>
        </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Package className="h-8 w-8" />
          {t("shipment:quotes_detail.title", { id: shipId })}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("shipment:quotes_detail.subtitle")}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("shipment:quotes_detail.total_quotes")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shipGroup.items.length}</p>
                <p className="text-xs text-muted-foreground">{t("shipment:quotes_detail.available_quotes")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("shipment:quotes_detail.transporters")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Truck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{shipGroup.transporters.length}</p>
                <p className="text-xs text-muted-foreground">{t("shipment:quotes_detail.different_transporters")}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("shipment:quotes_detail.total_containers")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <Box className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalContainers}</p>
                <p className="text-xs text-muted-foreground">{t("shipment:quotes_detail.containers_across")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quotes Section */}
      <Card>
        <CardHeader>
          <CardTitle>{t("shipment:quotes_detail.transporter_quotes")}</CardTitle>
          <CardDescription>
            {t("shipment:quotes_detail.compare_quotes")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {shipGroup.items.map((quoteItem: { id: number; transporter_id: number; ship_id: number; computed_price?: number; currency?: string; containers?: Array<{ id: number; container_number?: string; container_size?: string; container_type?: string; gross_weight?: number; gross_weight_unit?: string }> }) => {
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
            <DialogTitle>{t("shipment:quotes_detail.accept_quote")}</DialogTitle>
            <DialogDescription>
              {t("shipment:quotes_detail.accept_confirm", { id: selectedItem?.transporter_id })}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("shipment:quotes_detail.price_label")}</span>
                <span className="font-semibold text-lg">
                  {selectedItem?.computed_price?.toLocaleString() || "0"}{" "}
                  {selectedItem?.currency || "ETB"}
                </span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">{t("shipment:quotes_detail.containers_label")}</span>
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
              {t("common:buttons.cancel")}
            </Button>
            <Button onClick={confirmAccept} disabled={isAccepting}>
              {isAccepting ? t("shipment:quotes.accepting") : t("shipment:quotes_detail.accept_quote")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
