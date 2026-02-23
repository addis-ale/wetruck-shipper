"use client";

import { useState } from "react";
import { FolderOpen, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useShipmentDocuments } from "../../../server/hooks/use-shipment-documents";
import { ShipmentDocumentRow } from "./shipment-document-row";
import { UploadShipmentDocumentCard } from "./upload-shipment-document-card";
import { UploadShipmentDocumentDialog } from "./upload-shipment-document-dialog";

export function ShipmentDocumentsCard({
  shipId,
  variant = "default",
}: {
  shipId: number | null;
  variant?: "default" | "mobile";
}) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const { data, isLoading } = useShipmentDocuments(shipId as number);

  const documents = data ?? [];

  if (variant === "mobile" && shipId) {
    return (
      <div className="space-y-0">
        <div className="flex items-center justify-between mb-3">
          <span className="flex items-center gap-2 font-semibold text-foreground">
            <FolderOpen className="h-5 w-5 text-primary" />
            Documents
          </span>
          <Button
            size="sm"
            variant="ghost"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => setUploadOpen(true)}
          >
            <Upload className="h-4 w-4 mr-1" />
            Upload
          </Button>
        </div>
        <UploadShipmentDocumentDialog
          shipId={shipId}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
        />
        {isLoading && (
          <p className="text-sm text-muted-foreground py-2">
            Loading documents…
          </p>
        )}
        {!isLoading && documents.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            No documents uploaded yet
          </p>
        )}
        {!isLoading && documents.length > 0 && (
          <div className="border rounded-md divide-y divide-border">
            {documents.map((doc) => (
              <ShipmentDocumentRow
                key={doc.id}
                shipId={shipId}
                document={doc}
                compact
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <UploadShipmentDocumentCard shipId={shipId} />

      {!shipId && (
        <div className="border border-dashed rounded-md p-8 text-center bg-muted/20">
          <p className="text-sm text-muted-foreground">
            Select a shipment from the sidebar to view or upload documents
          </p>
        </div>
      )}

      {shipId && isLoading && (
        <div className="text-sm text-muted-foreground">Loading documents…</div>
      )}

      {shipId && !isLoading && documents.length === 0 && (
        <div className="text-sm text-muted-foreground">
          No documents uploaded yet
        </div>
      )}

      {shipId &&
        !isLoading &&
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
