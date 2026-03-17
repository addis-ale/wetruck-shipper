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
import type { ShipItem } from "@/lib/zod/shipment.schema";
import { Checkbox } from "@/components/ui/checkbox";
import { Package, Info, CheckCircle2, Loader2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation(["shipment", "common"]);
  const {
    data: acceptedShipItems,
    isLoading,
    error,
  } = useAcceptedShipItems(activeShipmentId);
  const [containersModalOpen, setContainersModalOpen] = useState(false);
  const [selectedShipItem, setSelectedShipItem] = useState<ShipItem | null>(
    null,
  );
  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());

  const completeMutation = useCompleteShipItem(activeShipmentId);

  const shipItemsList = acceptedShipItems ?? [];

  const hasReturningContainers = (item: ShipItem): boolean =>
    item.containers?.some((c) => c.is_returning === true) ?? false;

  const handleOpenContainersModal = (item: ShipItem) => {
    console.log(`[AcceptedShipItemsTable] Opening containers modal for shipItem: ${item.id}`);
    setSelectedShipItem(item);
    setContainersModalOpen(true);
  };

  const selectedShipItemIds = Array.from(selectedRowIds);

  const toggleRow = (shipItemId: number) => {
    setSelectedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(shipItemId)) next.delete(shipItemId);
      else next.add(shipItemId);
      return next;
    });
  };

  const allRowsSelected =
    shipItemsList.length > 0 &&
    shipItemsList.every((item) => selectedRowIds.has(item.id));
  const toggleSelectAll = () => {
    if (allRowsSelected) {
      setSelectedRowIds(new Set());
    } else {
      setSelectedRowIds(new Set(shipItemsList.map((item) => item.id)));
    }
  };

  const handleCompleteSelected = async () => {
    if (selectedShipItemIds.length === 0) return;
    for (const id of selectedShipItemIds) {
      await completeMutation.mutateAsync(id);
    }
    setSelectedRowIds(new Set());
  };

  const selectedContainers = selectedShipItem?.containers ?? [];

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("shipment:accepted.title")}
          </CardTitle>
          <CardDescription>
            {t("shipment:accepted.subtitle")}
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
            {t("shipment:accepted.title")}
          </CardTitle>
          <CardDescription>
            {t("shipment:accepted.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">
            {t("shipment:accepted.error_loading")}{" "}
            {error instanceof Error ? error.message : t("common:errors.unknown")}
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
            {t("shipment:accepted.title")}
          </CardTitle>
          <CardDescription>
            {t("shipment:accepted.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("shipment:accepted.select_shipment")}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (shipItemsList.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t("shipment:accepted.title")}
          </CardTitle>
          <CardDescription>
            {t("shipment:accepted.subtitle")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            {t("shipment:accepted.no_found")}
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
                {t("shipment:accepted.title")}
              </CardTitle>
              <CardDescription>
                {t("shipment:accepted.items_for", { count: shipItemsList.length, id: activeShipmentId })}
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
                    {t("shipment:accepted.completing")}
                  </>
                ) : (
                  t("shipment:accepted.complete")
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
                  <TableHead>{t("shipment:containers.title")}</TableHead>
                  <TableHead>{t("shipment:priced.return_status")}</TableHead>
                  <TableHead className="text-right">{t("common:labels.price")}</TableHead>
                  <TableHead>{t("common:labels.currency")}</TableHead>
                  <TableHead>{t("shipment:accepted.uploaded_docs")}</TableHead>
                  <TableHead className="text-right">{t("common:labels.status")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shipItemsList.map((item) => {
                  const rowKey = `ship-item-${item.id}`;
                  const hasReturning = hasReturningContainers(item);
                  const price = Number(item.computed_price) || 0;
                  const currency = item.currency || "ETB";
                  const containerCount = item.containers?.length ?? 0;

                  return (
                    <TableRow key={rowKey}>
                      <TableCell className="w-10">
                        <Checkbox
                          checked={selectedRowIds.has(item.id)}
                          onCheckedChange={() => toggleRow(item.id)}
                          aria-label={`Select ship item ${item.id}`}
                        />
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => handleOpenContainersModal(item)}
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
                              {t("common:status.returning")}
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
                                    {t("shipment:priced.returning_fee")}
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ) : (
                          <Badge variant="outline" className="w-fit text-xs">
                            {t("common:status.one_way")}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold">
                          {formatPrice(price)}
                        </span>
                      </TableCell>
                      <TableCell>{currency}</TableCell>
                      <TableCell>
                        <UploadedDocsCell shipItems={[item]} />
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {t("common:status.accepted")}
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
            <DialogTitle>{t("shipment:accepted.container_details")}</DialogTitle>
            <DialogDescription>
              {selectedShipItem && (
                <>
                  {t("shipment:accepted.showing_containers", { count: selectedContainers.length })}
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
                        <TableHead>{t("shipment:priced.container_number")}</TableHead>
                        <TableHead>{t("common:labels.size")}</TableHead>
                        <TableHead>{t("common:labels.type")}</TableHead>
                        <TableHead>{t("common:labels.weight")}</TableHead>
                        <TableHead>{t("shipment:priced.return_status")}</TableHead>
                        <TableHead>{t("common:labels.status")}</TableHead>
                        <TableHead>{t("common:labels.documents")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedContainers.map((container, index) => (
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
                                {t("common:status.returning")}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="w-fit text-xs"
                              >
                                {t("common:status.one_way")}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {(() => {
                              console.log(`[AcceptedShipItemsTable] Rendering row for container: ${container.id} (shipItem: ${selectedShipItem.id})`);
                              return (
                                <Badge variant="outline" className="w-fit text-xs">
                                  {container.status || t("common:na")}
                                </Badge>
                              );
                            })()}
                          </TableCell>
                          <TableCell>
                            {selectedShipItem && (
                              <UploadedDocsCell
                                shipItems={[{ id: selectedShipItem.id }]}
                                containerId={container.id}
                              />
                            )}
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
              {t("common:buttons.close")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
