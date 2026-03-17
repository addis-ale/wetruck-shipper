"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreVertical,
  Trash2,
  Eye,
  Loader2,
  FileText,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";

import type { ShipmentDocument } from "../../../server/types/shipment-document";
import { useShipmentDocument } from "../../../server/hooks/use-shipment-document";
import { useDeleteShipmentDocument } from "../../../server/hooks/use-delete-shipment-document";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";
import { useDocumentPreviewContext } from "@/components/providers/DocumentPreviewProvider";
import { extToMimeType } from "@/lib/utils/document-utils";
import { useTranslation } from "react-i18next";

/* ----------------------------------------
   Hard-coded document type labels
----------------------------------------- */
const DOCUMENT_TYPE_KEYS: Record<string, string> = {
  BILL_OF_LADING: "common:document_types.bill_of_lading",
  COMMERCIAL_INVOICE: "common:document_types.commercial_invoice",
  PACKING_LIST: "common:document_types.packing_list",
  DELIVERY_NOTE: "common:document_types.delivery_note",
  INSURANCE_CERTIFICATE: "common:document_types.insurance_certificate",
  CUSTOMS_DECLARATION: "common:document_types.customs_declaration",
  LICENSE: "common:document_types.license",
  PERMIT: "common:document_types.permit",
  OTHER: "common:document_types.other",
};
export function ShipmentDocumentRow({
  shipId,
  document: doc,
  compact,
}: {
  shipId: number;
  document: ShipmentDocument;
  compact?: boolean;
}) {
  const { t } = useTranslation(["shipment", "common"]);
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, isLoading } = useShipmentDocument(
    shipId,
    doc.id,
    shouldFetchPreview,
  );

  const { mutate: deleteDoc, isPending: isDeleting } =
    useDeleteShipmentDocument(shipId);

  const { openDocument } = useDocumentPreviewContext();

  /* ---------------- View logic ---------------- */

  const handleView = () => {
    setShouldFetchPreview(true);
  };

  const fileName = doc.file_path.split("/").pop() || "";
  const extension = fileName.split(".").pop()?.toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(
    extension || "",
  );

  useEffect(() => {
    if (data?.presigned_url && shouldFetchPreview) {
      openDocument(
        data.presigned_url,
        fileName || undefined,
        extToMimeType(doc.file_ext),
      );
      setShouldFetchPreview(false);
    }
  }, [data, shouldFetchPreview, openDocument, fileName, doc.file_ext]);

  const label = DOCUMENT_TYPE_KEYS[doc.document_type] ? t(DOCUMENT_TYPE_KEYS[doc.document_type]) : doc.document_type;

  if (compact) {
    return (
      <>
        <div className="flex items-center gap-3 py-2.5 px-1 border-b border-border last:border-b-0">
          <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded bg-primary/10 text-primary">
            {isImage ? (
              <ImageIcon className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground truncate" title={label}>
              {label}
            </p>
            <p
              className="text-xs text-muted-foreground truncate"
              title={fileName}
            >
              {fileName}
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs"
              onClick={handleView}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Eye className="h-3.5 w-3.5 mr-1" />
              )}
              {t("common:buttons.view")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 px-2.5 text-xs text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t("common:buttons.delete")}
            </Button>
          </div>
        </div>
        <ConfirmDeleteDialog
          open={confirmOpen}
          loading={isDeleting}
          onClose={() => setConfirmOpen(false)}
          onConfirm={() =>
            deleteDoc(doc.id, {
              onSuccess: () => {
                toast.success(t("shipment:documents.delete_success"));
                setConfirmOpen(false);
              },
              onError: (e: Error) => {
                toast.error(e.message || t("shipment:documents.delete_failed"));
                setConfirmOpen(false);
              },
            })
          }
        />
      </>
    );
  }

  return (
    <>
      {/* Row */}
      <div className="border rounded-md">
        <div className="flex items-center justify-between p-3">
          <div className="space-y-1">
            <p className="font-medium">{label}</p>
            <p className="text-sm text-muted-foreground">{fileName}</p>
          </div>

          {/* Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleView} disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {t("common:buttons.view")}
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("common:buttons.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <ConfirmDeleteDialog
        open={confirmOpen}
        loading={isDeleting}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() =>
          deleteDoc(doc.id, {
            onSuccess: () => {
              toast.success(t("shipment:documents.delete_success"));
              setConfirmOpen(false);
            },
            onError: (e: Error) => {
              toast.error(e.message || t("shipment:documents.delete_failed"));
              setConfirmOpen(false);
            },
          })
        }
      />
    </>
  );
}
