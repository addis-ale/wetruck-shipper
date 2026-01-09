"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: ShipItemDocument | null;
}

export function DocumentPreviewDialog({
    open,
    onOpenChange,
    document,
    shipItemId,
  }: Props & { shipItemId: number }) {
    if (!document) return null;
  
    const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/v1/ship-item/${shipItemId}/documents/${document.id}/download`;
  
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {document.document_type.replace(/_/g, " ")}
            </DialogTitle>
          </DialogHeader>
  
          <iframe
            src={fileUrl}
            className="w-full h-[75vh] border rounded"
          />
  
          <div className="flex justify-end">
            <Button asChild variant="outline">
              <a href={fileUrl} download>
                Download
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
  
