"use client";

import { useShipmentDocuments } from "../../../server/hooks/use-shipment-documents";
import { ShipmentDocumentRow } from "./shipment-document-row";
import { UploadShipmentDocumentCard } from "./upload-shipment-document-card";

export function ShipmentDocumentsCard({ shipId }: { shipId: number | null }) {
  const { data, isLoading } = useShipmentDocuments(shipId as number); // useShipmentDocuments already handles enabled: !!shipId

  const documents = data ?? [];

  return (
    <div className="space-y-4">
      <UploadShipmentDocumentCard shipId={shipId} />

      {/* No shipment selected */}
      {!shipId && (
        <div className="border border-dashed rounded-md p-8 text-center bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Select a shipment from the sidebar to view or upload documents
          </p>
        </div>
      )}

      {/* Loading state */}
      {shipId && isLoading && (
        <div className="text-sm text-muted-foreground">
          Loading documents…
        </div>
      )}

      {/* Empty state */}
      {shipId && !isLoading && documents.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No documents uploaded yet
        </div>
      )}

      {/* Documents list */}
      {shipId && !isLoading &&
        documents.map((doc) => (
          <ShipmentDocumentRow
            key={doc.id}
            shipId={shipId as number}
            document={doc}
          />
        ))}
    </div>
  );
}
