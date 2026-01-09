"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useUploadShipItemDocument } from "@/app/modules/shipment/server/hooks/use-upload-ship-item-document";

export function UploadDocumentDialog({ shipItemId }: { shipItemId: number }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("proof_of_delivery");

  const { mutate, isPending } = useUploadShipItemDocument(shipItemId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Upload Document</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <select
            className="border rounded p-2 w-full"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="proof_of_delivery">Proof of Delivery</option>
            <option value="container_return_receipt">
              Container Return Receipt
            </option>
          </select>

          <input
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <Button
            disabled={!file || isPending}
            onClick={() => {
              if (!file) return;
              mutate({ document_type: type, file });
              setOpen(false);
            }}
          >
            Upload
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
