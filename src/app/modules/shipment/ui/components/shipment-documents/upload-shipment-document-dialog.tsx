"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { FileText, Upload, X } from "lucide-react";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useCreateShipmentDocument } from "@/app/modules/shipment/server/hooks/use-create-shipment-document";
import { useTranslation } from "react-i18next";

/* ----------------------------------------
   Hard-coded shipment document types
----------------------------------------- */
const SHIPMENT_DOCUMENT_TYPES = [
  { value: "BILL_OF_LADING", labelKey: "common:document_types.bill_of_lading" },
  { value: "PACKING_LIST", labelKey: "common:document_types.packing_list" },
] as const;

type ShipmentDocumentType = (typeof SHIPMENT_DOCUMENT_TYPES)[number]["value"];

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
  const { t } = useTranslation(["shipment", "common"]);
  const [file, setFile] = useState<File | null>(null);
  const [type, setType] = useState<ShipmentDocumentType>("BILL_OF_LADING");
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { mutate, isPending } = useCreateShipmentDocument(shipId);

  useEffect(() => {
    if (!open) {
      setFile(null);
      setUploadError(null);
      setType("BILL_OF_LADING");
    }
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="flex flex-col rounded-t-xl p-0 max-h-[85vh] overflow-hidden w-full"
      >
        <SheetHeader className="shrink-0 border-b px-6 py-4">
          <SheetTitle className="text-xl">{t("shipment:documents.upload_document")}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
          <div className="p-6 space-y-6 w-full overflow-hidden">
            {/* Document type */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("shipment:documents.document_type")}
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
                  {SHIPMENT_DOCUMENT_TYPES.map((dt) => (
                    <SelectItem key={dt.value} value={dt.value}>
                      {t(dt.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File picker */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                {t("shipment:documents.choose_file")}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => {
                  const selectedFile = e.target.files?.[0] ?? null;
                  setFile(selectedFile);
                  setUploadError(null);
                }}
              />

              <Button
                type="button"
                variant="outline"
                className="w-full h-10 flex items-center justify-center gap-2"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-4 w-4" />
                {t("shipment:documents.browse_files")}
              </Button>

              {file && (
                <div className="flex items-center gap-3 border rounded-md p-3 min-w-0">
                  <FileText className="h-5 w-5 shrink-0 text-primary" />
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p
                      className="truncate text-sm font-medium"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0"
                    onClick={() => {
                      setFile(null);
                      setUploadError(null);
                    }}
                    disabled={isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {uploadError && (
                <p className="text-xs font-medium text-destructive mt-1 italic animate-in fade-in slide-in-from-top-1">
                  {uploadError}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full h-10"
                onClick={() => {
                  setFile(null);
                  setUploadError(null);
                  onOpenChange(false);
                }}
                disabled={isPending}
              >
                {t("common:buttons.cancel")}
              </Button>

              <Button
                className="w-full h-10"
                disabled={!file || isPending}
                onClick={() => {
                  if (!file) return;
                  setUploadError(null);

                  mutate(
                    { document_type: type, file },
                    {
                      onSuccess: () => {
                        toast.success(t("shipment:documents.upload_success"));
                        setFile(null);
                        setUploadError(null);
                        onOpenChange(false);
                      },
                      onError: (err: Error) => {
                        setUploadError(err.message);
                        toast.error(err.message || t("shipment:documents.upload_failed"));
                      },
                    },
                  );
                }}
              >
                {isPending ? t("shipment:documents.uploading") : t("shipment:documents.upload_document")}
              </Button>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
