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

interface ContainerColumnsProps {
  activeShipmentId: number | null;
  assignedContainers: number[];
  onAssign: (containerId: number) => void;
  onRemove: (containerId: number) => void;
  shipmentStatus?: string;
  data?: Container[];
}

export function useContainerAssignColumns({
  activeShipmentId,
  assignedContainers,
  onAssign,
  onRemove,
  shipmentStatus,
  data = [],
}: ContainerColumnsProps): ColumnDef<Container>[] {
  const isDisabled = shipmentStatus === "price_requested";

  return [
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
      cell: ({ row }) => {
        const status = row.original.status;
        const isAssigned = assignedContainers.includes(row.original.id);
        
        const variant = isAssigned
          ? "default"
          : status === "created"
          ? "secondary"
          : status === "in_transit"
          ? "outline"
          : "secondary";

        return (
          <Badge variant={variant}>
            {isAssigned ? "Assigned" : status}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const isAssigned = assignedContainers.includes(row.original.id);
        const [showRemoveDialog, setShowRemoveDialog] = useState(false);

        if (!activeShipmentId) {
          return (
            <span className="text-xs text-muted-foreground">
              Select a shipment
            </span>
          );
        }

        if (isDisabled) {
          return (
            <span className="text-xs text-muted-foreground">
              Price requested
            </span>
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
                disabled={isDisabled}
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
                      <strong>{row.original.container_number}</strong> from this
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
                        onRemove(row.original.id);
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
          <Button
            size="sm"
            onClick={() => onAssign(row.original.id)}
            className="h-8"
            disabled={isDisabled}
          >
            <Plus className="h-3 w-3 mr-1" />
            Assign
          </Button>
        );
      },
    },
  ];
}

