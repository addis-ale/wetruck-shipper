"use client";

import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { shipItemDocumentsApi } from "@/app/modules/shipment/server/api/ship-item-documents.api";
import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";
import { FileText, ExternalLink, Download, Loader2 } from "lucide-react";

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  proof_of_delivery: "Proof of Delivery (POD)",
  container_return_receipt: "Interchange Document (Return)",
};

function getDocumentTypeLabel(type: string): string {
  return DOCUMENT_TYPE_LABELS[type] ?? type.replace(/_/g, " ");
}

function getFileName(filePath: string): string {
  return filePath.split("/").pop() ?? filePath;
}

interface DocumentWithShipItem {
  shipItemId: number;
  document: ShipItemDocument;
}

interface UploadedDocumentsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents: DocumentWithShipItem[];
}

function UploadedDocumentsModal({
  open,
  onOpenChange,
  documents,
}: UploadedDocumentsModalProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handlePreview = async (shipItemId: number, doc: ShipItemDocument) => {
    const key = `${shipItemId}-${doc.id}`;
    setLoadingId(key);
    try {
      const { presigned_url } = await shipItemDocumentsApi.get(
        shipItemId,
        doc.id,
      );
      if (presigned_url)
        window.open(presigned_url, "_blank", "noopener,noreferrer");
    } catch {
      // Error already surfaced by API
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (shipItemId: number, doc: ShipItemDocument) => {
    const key = `${shipItemId}-${doc.id}`;
    setLoadingId(key);
    try {
      const { presigned_url } = await shipItemDocumentsApi.get(
        shipItemId,
        doc.id,
      );
      if (presigned_url) {
        const link = document.createElement("a");
        link.href = presigned_url;
        link.download = getFileName(doc.file_path) || `document-${doc.id}`;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch {
      // Error already surfaced by API
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Uploaded documents</DialogTitle>
          <DialogDescription>
            Preview or download documents. Click Preview to open in a new tab,
            or Download to save the file.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto border rounded-md divide-y">
          {documents.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No documents uploaded yet.
            </div>
          ) : (
            documents.map(({ shipItemId, document: doc }) => {
              const key = `${shipItemId}-${doc.id}`;
              const isLoading = loadingId === key;
              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-4 p-3 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1 flex items-center gap-3">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <p className="font-medium text-sm">
                        {getDocumentTypeLabel(doc.document_type)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {getFileName(doc.file_path)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(shipItemId, doc)}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Preview
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(shipItemId, doc)}
                      disabled={isLoading}
                      title="Download document"
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="h-3.5 w-3.5 mr-1" />
                          Download
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface UploadedDocsCellProps {
  shipItems: Array<{ id: number }>;
}

export function UploadedDocsCell({ shipItems }: UploadedDocsCellProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const documentQueries = useQueries({
    queries: shipItems.map((si) => ({
      queryKey: ["ship-item-documents", si.id],
      queryFn: () => shipItemDocumentsApi.list(si.id),
    })),
  });

  const allLoaded = documentQueries.every(
    (q) => !q.isLoading && q.data != null,
  );
  const documentsByShipItem = documentQueries.map((q) => q.data ?? []);
  const totalCount = documentsByShipItem.reduce(
    (sum, docs) => sum + docs.length,
    0,
  );

  const flatDocuments: DocumentWithShipItem[] = shipItems.flatMap((si, i) =>
    (documentsByShipItem[i] ?? []).map((document: ShipItemDocument) => ({
      shipItemId: si.id,
      document,
    })),
  );

  if (!allLoaded) {
    return <span className="text-muted-foreground text-sm">…</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="text-sm font-medium text-primary hover:underline cursor-pointer"
      >
        {totalCount}
      </button>
      <UploadedDocumentsModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        documents={flatDocuments}
      />
    </>
  );
}
