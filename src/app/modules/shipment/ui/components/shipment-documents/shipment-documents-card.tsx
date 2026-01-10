"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useShipmentDocuments } from
  "@/app/modules/shipment/server/hooks/use-shipment-documents";
import { ShipmentDocumentRow } from "./shipment-document-row";
import { UploadShipmentDocumentDialog } from
  "./upload-shipment-document-dialog";

export function ShipmentDocumentsCard({ shipId }: { shipId: number }) {
  const { data, isLoading } = useShipmentDocuments(shipId);
  const [open, setOpen] = useState(false);

  if (isLoading) return null;

  return (
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Shipment Documents</h3>
        <Button size="sm" onClick={() => setOpen(true)}>
          Upload Document
        </Button>
      </div>

      {data?.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No documents uploaded yet
        </p>
      )}

      <div className="space-y-2">
        {data?.map((doc) => (
          <ShipmentDocumentRow
            key={doc.id}
            shipId={shipId}
            document={doc}
          />
        ))}
      </div>

      <UploadShipmentDocumentDialog
        shipId={shipId}
        open={open}
        onOpenChange={setOpen}
      />
    </div>
  );
}
