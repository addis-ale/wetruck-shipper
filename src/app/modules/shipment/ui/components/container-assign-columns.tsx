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
  const [showRemoveDialog, setShowRemoveDialog] = useState(false);

  if (!activeShipmentId) {
    return (
      <span className="text-xs text-muted-foreground">Select a shipment</span>
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
          Remove
        </Button>

        <Dialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Remove Container</DialogTitle>
              <DialogDescription>
                Are you sure you want to remove container{" "}
                <strong>{container.container_number}</strong> from this
                shipment?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowRemoveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  onRemove(container.id);
                  setShowRemoveDialog(false);
                }}
              >
                Remove
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
      Assign
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
  const columns: ColumnDef<Container>[] = [
    {
      accessorKey: "container_number",
      header: "Container Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.container_number}</span>
      ),
    },
    {
      accessorKey: "container_size",
      header: "Size",
      cell: ({ row }) => {
        const size = row.original.container_size;
        return size === "twenty_feet" ? "20ft" : "40ft";
      },
    },
    {
      accessorKey: "container_type",
      header: "Type",
      cell: ({ row }) => {
        const type = row.original.container_type;
        return type.charAt(0).toUpperCase() + type.slice(1);
      },
    },
    {
      accessorKey: "gross_weight",
      header: "Weight",
      cell: ({ row }) => (
        <span>
          {row.original.gross_weight} {row.original.gross_weight_unit}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: () => {
        // This table only shows containers assigned to the shipment, so status is always Assigned
        return <Badge variant="default">Assigned</Badge>;
      },
    },
    ...(showActionsColumn
      ? [
          {
            id: "actions",
            header: "Actions",
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
