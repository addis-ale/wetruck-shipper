"use client";

import { MoreVertical, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

import type { ShipmentDocument } from "@/app/modules/shipment/server/types/shipment-document";
import { useDeleteShipmentDocument } from
  "@/app/modules/shipment/server/hooks/use-delete-shipment-document";

export function ShipmentDocumentRow({
  shipId,
  document,
}: {
  shipId: number;
  document: ShipmentDocument;
}) {
  const { mutate: deleteDoc } = useDeleteShipmentDocument(shipId);

  return (
    <div className="flex items-center justify-between border rounded p-3">
      <div>
        <p className="font-medium capitalize">
          {document.document_type.replace(/_/g, " ")}
        </p>
        <p className="text-sm text-muted-foreground truncate max-w-[220px]">
          {document.file_path.split("/").pop()}
        </p>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end">
          <DropdownMenuItem
            className="text-destructive"
            onClick={() =>
              deleteDoc(document.id, {
                onSuccess: () => toast.success("Document deleted"),
              })
            }
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
