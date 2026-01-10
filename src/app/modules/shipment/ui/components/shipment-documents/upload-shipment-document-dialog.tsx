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
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateShipmentDocument } from
  "@/app/modules/shipment/server/hooks/use-create-shipment-document";

interface Props {
  shipId: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UploadShipmentDocumentDialog({
  shipId,
  open,
  onOpenChange,
}: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("proof_of_delivery");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useCreateShipmentDocument(shipId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[calc(100vw-24px)]
          sm:max-w-lg
          max-h-[calc(100vh-24px)]
          overflow-y-auto
          rounded-lg
        "
      >
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>

        {/* Document type */}
        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select document type" />
          </SelectTrigger>

          <SelectContent
            position="popper"
            side="bottom"
            align="start"
            sideOffset={6}
            className="w-[--radix-select-trigger-width]"
          >
            <SelectItem value="proof_of_delivery">
              Proof of Delivery
            </SelectItem>
            <SelectItem value="container_return_receipt">
              Container Return Receipt
            </SelectItem>
            <SelectItem value="bill_of_lading">
              Bill of Lading
            </SelectItem>
            <SelectItem value="commercial_invoice">
              Commercial Invoice
            </SelectItem>
          </SelectContent>
        </Select>

        {/* File picker */}
        <div className="space-y-2 mt-4">
          <input
            ref={fileInputRef}
            type="file"
            hidden
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />

          <Button
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4" />
            Choose file
          </Button>

          {/* Selected file (trimmed, no stretch) */}
          {file && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded p-2">
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate max-w-full">
                {file.name}
              </span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-2 mt-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>

          <Button
            className="w-full"
            disabled={!file || isPending}
            onClick={() => {
              if (!file) return;

              mutate(
                { document_type: type, file },
                {
                  onSuccess: () => {
                    toast.success("Document uploaded successfully");
                    setFile(null);
                    onOpenChange(false);
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
