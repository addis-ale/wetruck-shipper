"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText, Upload, X } from "lucide-react";
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

/* ----------------------------------------
   Hard-coded shipment document types
----------------------------------------- */
const SHIPMENT_DOCUMENT_TYPES = [
  { value: "BILL_OF_LADING", label: "Bill of Lading" },
  { value: "PACKING_LIST", label: "Packing List" },
] as const;

type ShipmentDocumentType =
  (typeof SHIPMENT_DOCUMENT_TYPES)[number]["value"];

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
  const [type, setType] =
    useState<ShipmentDocumentType>("BILL_OF_LADING");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useCreateShipmentDocument(shipId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-full
          sm:w-[420px]
          max-w-[420px]
          overflow-x-hidden
          p-6
        "
      >
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl">
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Document Type
            </label>

            <Select
              value={type}
              onValueChange={(value) =>
                setType(value as ShipmentDocumentType)
              }
            >
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {SHIPMENT_DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Choose File
            </label>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) =>
                setFile(e.target.files?.[0] ?? null)
              }
            />

            <Button
              type="button"
              variant="outline"
              className="w-full h-10 flex items-center justify-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              Browse Files
            </Button>

            {/* ✅ FIXED filename rendering */}
            {file && (
              <div className="flex items-center gap-3 border rounded-md p-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />

                {/* 👇 THIS IS THE KEY */}
                <div className="overflow-hidden max-w-[240px]">
                  <p
                    className="truncate text-sm font-medium"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto shrink-0"
                  onClick={() => setFile(null)}
                  disabled={isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full h-10"
              onClick={() => {
                setFile(null);
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              className="w-full h-10"
              disabled={!file || isPending}
              onClick={() => {
                if (!file) return;

                mutate(
                  { document_type: type, file },
                  {
                    onSuccess: () => {
                      toast.success(
                        "Document uploaded successfully"
                      );
                      setFile(null);
                      onOpenChange(false);
                    },
                    onError: (err: Error) =>
                      toast.error(
                        err.message || "Upload failed"
                      ),
                  }
                );
              }}
            >
              {isPending ? "Uploading..." : "Upload Document"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
