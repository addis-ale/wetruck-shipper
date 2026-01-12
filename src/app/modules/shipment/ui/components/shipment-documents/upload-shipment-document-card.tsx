"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

import { UploadShipmentDocumentDialog } from "./upload-shipment-document-dialog";

export function UploadShipmentDocumentCard({
  shipId,
}: {
  shipId: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="border rounded-md p-4 flex items-center justify-between">
        <div>
          <p className="font-medium">Documents</p>
          <p className="text-sm text-muted-foreground">
            Upload shipment-related documents
          </p>
        </div>

        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      <UploadShipmentDocumentDialog
        shipId={shipId}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
