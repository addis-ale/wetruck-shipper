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
          sm:w-[400px]
          max-h-[calc(100vh-24px)]
          overflow-y-auto
          rounded-lg
          p-4
          sm:p-6
        "
      >
        <DialogHeader className="space-y-1 mb-4">
          <DialogTitle className="text-lg sm:text-xl">
            Upload Document
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Document type */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Document Type
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="w-full h-10">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>

              <SelectContent
                position="popper"
                side="bottom"
                align="start"
                sideOffset={6}
                className="w-[--radix-select-trigger-width] max-h-60"
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
          </div>

          {/* File picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-muted-foreground">
              Choose File
            </label>
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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

              {/* Selected file with remove option */}
              {file && (
                <div className="flex items-center justify-between gap-3 p-3 border rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={() => setFile(null)}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Actions - Desktop layout */}
          <div className="hidden sm:block space-y-2">
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
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Uploading...
                </div>
              ) : (
                "Upload Document"
              )}
            </Button>
          </div>

          {/* Actions - Mobile layout */}
          <div className="sm:hidden flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => {
                setFile(null);
                onOpenChange(false);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>

            <Button
              className="flex-1 h-10"
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
              {isPending ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Upload
                </div>
              ) : (
                "Upload"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}