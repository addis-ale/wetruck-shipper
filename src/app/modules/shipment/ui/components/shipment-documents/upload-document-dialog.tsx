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
import { useUploadShipItemDocument } from "@/app/modules/shipment/server/hooks/use-upload-ship-item-document";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export function UploadDocumentDialog({ shipItemId }: { shipItemId: number }) {
  const { t } = useTranslation(["shipment", "common"]);
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState("container_return_receipt");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useUploadShipItemDocument(shipItemId);

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
          setUploadError(null);
        }}
      >
        {t("shipment:documents.upload_document")}
      </Button>

      <Dialog
        open={open}
        onOpenChange={(val) => {
          setOpen(val);
          if (!val) {
            setFile(null);
            setUploadError(null);
          }
        }}
      >
        <DialogContent className="overflow-hidden max-w-[calc(100vw-2rem)] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("shipment:documents.upload_document")}</DialogTitle>
          </DialogHeader>

          {/* Document type */}
          <select
            className="border rounded p-2 w-full mb-4"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="proof_of_delivery">{t("common:document_types.proof_of_delivery")}</option>
            <option value="container_return_receipt">
              {t("common:document_types.container_return_receipt")}
            </option>
          </select>

          {/* File picker */}
          <div className="space-y-2 overflow-hidden">
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setUploadError(null);
              }}
            />

            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-4 w-4" />
              {t("shipment:documents.choose_file_btn")}
            </Button>

            {/* Selected file display */}
            {file && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground border rounded p-2 min-w-0 overflow-hidden">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="flex-1 truncate min-w-0" title={file.name}>
                  {file.name}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="shrink-0 h-6 w-6"
                  onClick={() => {
                    setFile(null);
                    setUploadError(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}

            {uploadError && (
              <p className="text-xs font-medium text-destructive mt-1 italic">
                {uploadError}
              </p>
            )}
          </div>

          {/* Upload */}
          <Button
            className="mt-4 w-full"
            disabled={!file || isPending}
            onClick={() => {
              if (!file) return;
              setUploadError(null);

              mutate(
                { document_type: type, file },
                {
                  onSuccess: () => {
                    toast.success(t("shipment:documents.upload_success"));
                    setOpen(false);
                    setFile(null);
                    setUploadError(null);
                  },
                  onError: (err: Error) => {
                    setUploadError(err.message);
                    toast.error(err.message || t("shipment:documents.upload_failed"));
                  },
                },
              );
            }}
          >
            {isPending ? t("shipment:documents.uploading") : t("common:buttons.upload")}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
