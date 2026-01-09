"use client";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { FileText } from "lucide-react";
import { useShipItemDocuments } from "@/app/modules/shipment/server/hooks/use-ship-item-documents";
import { UploadDocumentDialog } from "./upload-document-dialog";
import { DocumentRow } from "./document-row";
import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";

export function ShipmentDocuments({ shipItemId }: { shipItemId: number }) {
  const { data: documents = [], isLoading } =
    useShipItemDocuments(shipItemId);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Shipment Documents
        </CardTitle>
        <CardDescription>
          Upload and manage required documents for this shipment
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <UploadDocumentDialog shipItemId={shipItemId} />

        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading documents…
          </p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No documents uploaded yet.
          </p>
        ) : (
          documents.map((doc: ShipItemDocument) => (
            <DocumentRow
              key={doc.id}
              shipItemId={shipItemId}
              document={doc}
            />
          ))
        )}
      </CardContent>
    </Card>
  );
}
