"use client";

import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { useDeleteShipItemDocument } from "@/app/modules/shipment/server/hooks/use-delete-ship-item-document";
import { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";

export function DocumentRow({
  shipItemId,
  document,
}: {
  shipItemId: number;
  document: ShipItemDocument;
}) {
  const { mutate } = useDeleteShipItemDocument(shipItemId);

  return (
    <div className="flex items-center justify-between border rounded p-3">
      <div>
        <p className="font-medium">{document.document_type}</p>
        <a
          href={document.file_url}
          target="_blank"
          className="text-sm text-blue-600"
        >
          View document
        </a>
      </div>

      <Button
        size="icon"
        variant="destructive"
        onClick={() => mutate(document.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
