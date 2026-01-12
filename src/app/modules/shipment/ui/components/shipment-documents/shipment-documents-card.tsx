"use client";

import { useShipmentDocuments } from "../../../server/hooks/use-shipment-documents";
import { ShipmentDocumentRow } from "./shipment-document-row";
import { UploadShipmentDocumentCard } from "./upload-shipment-document-card";

export function ShipmentDocumentsCard({ shipId }: { shipId: number }) {
  const { data, isLoading } = useShipmentDocuments(shipId);

  const documents = data ?? [];

  return (
    <div className="space-y-4">

      <UploadShipmentDocumentCard shipId={shipId} />

      {/* Loading state */}
      {isLoading && (
        <div className="text-sm text-muted-foreground">
          Loading documents…
        </div>
      )}

      {/* Empty state */}
      {!isLoading && documents.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No documents uploaded yet
        </div>
      )}

      {/* Documents list */}
      {!isLoading &&
        documents.map((doc) => (
          <ShipmentDocumentRow
            key={doc.id}
            shipId={shipId}
            document={doc}
          />
        ))}
    </div>
  );
}
