"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";

import { useShipItemDocumentPreview } from
  "@/app/modules/shipment/server/hooks/use-ship-item-document-preview";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shipItemId: number;
  documentId: number | null;
  documentType?: string;
}

export function DocumentPreviewDialog({
  open,
  onOpenChange,
  shipItemId,
  documentId,
  documentType,
}: Props) {
  const { data, isLoading } = useShipItemDocumentPreview(
    shipItemId,
    documentId,
    open
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>
            {documentType?.replace(/_/g, " ")}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="flex items-center justify-center h-[60vh]">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {data?.presigned_url && (
          <iframe
            src={data.presigned_url}
            className="w-full h-[75vh] border rounded"
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
