"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import type { Container } from "@/app/modules/container/server/types/container.types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Minus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";

// Component for action cell to allow useState hook
function ActionCell({
  container,
  isAssigned,
  activeShipmentId,
  onAssign,
  onRemove,
}: {
  container: Container;
  isAssigned: boolean;
  activeShipmentId: number | null;
  onAssign: (id: number) => void;
  onRemove: (id: number) => void;
}) {
  const { t } = useTranslation(["shipment", "common"]);
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  if (!activeShipmentId) {
    return (
      <span className="text-xs text-muted-foreground">{t("shipment:assign_table.select_shipment")}</span>
    );
  }

  if (isAssigned) {
    return (
      <>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowRemoveDialog(true)}
          className="h-8"
        >
          <Minus className="h-3 w-3 mr-1" />
          {t("common:buttons.remove")}
        </Button>

        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("shipment:remove_container.title")}</DialogTitle>
              <DialogDescription>
                {t("shipment:assign_table.remove_confirm", { number: container.container_number })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRemoveDialog(false)}
              >
                {t("common:buttons.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onRemove(container.id);
                  setShowRemoveDialog(false);
                }}
              >
                {t("common:buttons.remove")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <Button size="sm" onClick={() => onAssign(container.id)} className="h-8">
      <Plus className="h-3 w-3 mr-1" />
      {t("shipment:assign_table.assign")}
    </Button>
  );
}

interface ContainerColumnsProps {
  activeShipmentId: number | null;
  assignedContainers: number[];
  onAssign: (containerId: number) => void;
  onRemove: (containerId: number) => void;
  data?: Container[];
  /** When false, the Actions column is omitted (e.g. for price_requested tab) */
  showActionsColumn?: boolean;
}

export function useContainerAssignColumns({
  activeShipmentId,
  assignedContainers,
  onAssign,
  onRemove,
  showActionsColumn = true,
}: ContainerColumnsProps): ColumnDef<Container>[] {
  const { t } = useTranslation(["shipment", "common"]);
  const columns: ColumnDef<Container>[] = [
    {
      accessorKey: "container_number",
      header: t("shipment:assign_table.container_name"),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.container_number}</span>
      ),
    },
    {
      accessorKey: "container_size",
      header: t("common:labels.size"),
      cell: ({ row }) => {
        const size = row.original.container_size;
        return size === "twenty_feet" ? "20ft" : "40ft";
      },
    },
    {
      accessorKey: "container_type",
      header: t("common:labels.type"),
      cell: ({ row }) => {
        const type = row.original.container_type;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
    },
    {
      accessorKey: "gross_weight",
      header: t("common:labels.weight"),
      cell: ({ row }) => (
        <span>
          {row.original.gross_weight} {row.original.gross_weight_unit}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: t("common:labels.status"),
      cell: () => {
        return <Badge variant="default">{t("common:status.assigned")}</Badge>;
      },
    },
    ...(showActionsColumn
      ? [
          {
            id: "actions",
            header: t("common:labels.actions"),
            cell: ({ row }) => {
              const isAssigned = assignedContainers.includes(row.original.id);
              return (
                <ActionCell
                  container={row.original}
                  isAssigned={isAssigned}
                  activeShipmentId={activeShipmentId}
                  onAssign={onAssign}
                  onRemove={onRemove}
                />
              );
            },
          } as ColumnDef<Container>,
        ]
      : []),
  ];
  return columns;
}
