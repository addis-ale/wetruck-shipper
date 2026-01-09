"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Upload } from "lucide-react";
import { useUploadShipItemDocument } from "@/app/modules/shipment/server/hooks/use-upload-ship-item-document";
import { toast } from "sonner";

export function UploadDocumentDialog({ shipItemId }: { shipItemId: number }) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("container_return_receipt");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useUploadShipItemDocument(shipItemId);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Upload Document</Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          {/* Document type */}
          <select
            className="border rounded p-2 w-full mb-4"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="proof_of_delivery">Proof of Delivery</option>
            <option value="container_return_receipt">
              Container Return Receipt
            </option>
          </select>

          {/* File picker */}
          <div className="space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Choose file
            </Button>

            {/* Selected file display */}
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded p-2">
                <FileText className="h-4 w-4" />
                <span className="truncate">{file.name}</span>
              </div>
            )}
          </div>

          {/* Upload */}
          <Button
            className="mt-4 w-full"
            disabled={!file || isPending}
            onClick={() => {
              if (!file) return;

              mutate(
                { document_type: type, file },
                {
                  onSuccess: () => {
                    toast.success("Document uploaded successfully");
                    setOpen(false);
                    setFile(null);
                  },
                  onError: (err: any) => {
                    toast.error(err.message || "Upload failed");
                  },
                }
              );
            }}
          >
            {isPending ? "Uploading..." : "Upload"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
