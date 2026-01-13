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
  X,
} from "lucide-react";
import { toast } from "sonner";

import type { ShipmentDocument } from "../../../server/types/shipment-document";
import { useShipmentDocument } from "../../../server/hooks/use-shipment-document";
import { useDeleteShipmentDocument } from "../../../server/hooks/use-delete-shipment-document";
import { ConfirmDeleteDialog } from "./confirm-delete-dialog";

/* ----------------------------------------
   Hard-coded document type labels
----------------------------------------- */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  BILL_OF_LADING: "Bill of Lading",
  COMMERCIAL_INVOICE: "Commercial Invoice",
  PACKING_LIST: "Packing List",
  DELIVERY_NOTE: "Delivery Note",
  INSURANCE_CERTIFICATE: "Insurance Certificate",
  CUSTOMS_DECLARATION: "Customs Declaration",
  LICENSE: "License",
  PERMIT: "Permit",
  OTHER: "Other",
};
export function ShipmentDocumentRow({
  shipId,
  document: doc,
}: {
  shipId: number;
  document: ShipmentDocument;
}) {
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const { data, isLoading } = useShipmentDocument(
    shipId,
    doc.id,
    shouldFetchPreview
  );

  const { mutate: deleteDoc, isPending: isDeleting } =
    useDeleteShipmentDocument(shipId);

  /* ---------------- View logic ---------------- */

  const handleView = () => {
    setShouldFetchPreview(true);
  };

  useEffect(() => {
    if (data?.presigned_url && shouldFetchPreview) {
      setIsViewing(true);
   
      if (isImage) {
        fetchImageForNewTab(data.presigned_url);
      }
    }
  }, [data, shouldFetchPreview]);

  const fetchImageForNewTab = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      setImageUrl(blobUrl);
    } catch (error) {
      console.error("Failed to fetch image for new tab:", error);
      setImageUrl(url);
    }
  };

  const closeViewer = () => {
    setIsViewing(false);
    setShouldFetchPreview(false);
    if (imageUrl && imageUrl.startsWith('blob:')) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(null);
  };

  const handleOpenInNewTab = () => {
    if (!data?.presigned_url) return;
  
    const link = document.createElement("a");
    link.href = data.presigned_url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.click();
  };
  
  const fileName = doc.file_path.split("/").pop() || "";
  const extension = fileName.split(".").pop()?.toLowerCase();

  const isImage = ["jpg", "jpeg", "png", "gif", "webp"].includes(extension || "");
  const isPdf = extension === "pdf";

  const label =
    DOCUMENT_TYPE_LABELS[doc.document_type] ?? doc.document_type;

  useEffect(() => {
    return () => {
      if (imageUrl && imageUrl.startsWith('blob:')) {
        URL.revokeObjectURL(imageUrl);
      }
    };
  }, [imageUrl]);

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
              <DropdownMenuItem
                onClick={handleView}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                View
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
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
              toast.success("Document deleted successfully");
              setConfirmOpen(false);
            },
            onError: (e: any) => {
              toast.error(e.message || "Delete failed");
              setConfirmOpen(false);
            },
          })
        }
      />

      {/* Viewer Modal */}
      {isViewing && data?.presigned_url && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="font-medium">{label}</h3>
                <p className="text-sm text-muted-foreground">
                  {fileName}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  disabled={!data?.presigned_url || (isImage && !imageUrl)}
                >
                  {isImage && !imageUrl ? 'Loading...' : 'Open in New Tab'}
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeViewer}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : isImage ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={data.presigned_url}
                    alt={label}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <iframe
                  src={data.presigned_url}
                  className="w-full h-full min-h-[500px]"
                  title={label}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}