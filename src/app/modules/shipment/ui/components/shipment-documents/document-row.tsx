"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";

import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";
import { useDeleteShipItemDocument } from "@/app/modules/shipment/server/hooks/use-delete-ship-item-document";
import { useUpdateShipItemDocument } from "@/app/modules/shipment/server/hooks/use-update-ship-item-document";
import { useShipItemDocumentPreview } from
  "@/app/modules/shipment/server/hooks/use-ship-item-document-preview";

export function DocumentRow({
  shipItemId,
  document: doc,
}: {
  shipItemId: number;
  document: ShipItemDocument;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [docType, setDocType] = useState(doc.document_type);
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const { mutate: deleteDoc, isPending: isDeleting } =
    useDeleteShipItemDocument(shipItemId);

  const { mutate: updateDoc, isPending: isUpdating } =
    useUpdateShipItemDocument(shipItemId, doc.id);

  const { data, isLoading, isError } = useShipItemDocumentPreview(
    shipItemId,
    doc.id,
    shouldFetchPreview
  );

  // Handle viewing the document
  const handleViewDocument = () => {
    setShouldFetchPreview(true);
  };

  useEffect(() => {
    if (data?.presigned_url && shouldFetchPreview) {
      setIsViewing(true);
    }
  }, [data, shouldFetchPreview]);

  const closeViewer = () => {
    setIsViewing(false);
    setShouldFetchPreview(false);
  };


  const handleOpenInNewTab = () => {
    console.log("Opening URL:", data?.presigned_url);
    if (data?.presigned_url) {
      window.open(data.presigned_url, '_blank', 'noopener,noreferrer');
    }
  };

  const getFileExtension = () => {
    const filename = doc.file_path.split("/").pop() || "";
    return filename.split('.').pop()?.toLowerCase();
  };

  const fileExtension = getFileExtension();
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(fileExtension || '');
  const isPdf = fileExtension === 'pdf';

  return (
    <>
      <div className="border rounded-md">
        {/* Row */}
        <div className="flex items-center justify-between p-3">
          <div className="space-y-1">
            <p className="font-medium capitalize">
              {docType.replace(/_/g, " ")}
            </p>

            <p className="text-sm text-muted-foreground">
              {doc.file_path.split("/").pop()}
            </p>

            <select
              className="text-xs border rounded px-2 py-1 mt-1"
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
            >
              <option value="proof_of_delivery">Proof of Delivery</option>
              <option value="bill_of_lading">Bill of Lading</option>
              <option value="commercial_invoice">Commercial Invoice</option>
            </select>
          </div>

          {/* 3-dot menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end">
              <DropdownMenuItem 
                onClick={handleViewDocument}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Eye className="mr-2 h-4 w-4" />
                )}
                {isLoading ? "Loading..." : "View"}
              </DropdownMenuItem>

              <DropdownMenuItem
                disabled={isUpdating}
                onClick={() => fileRef.current?.click()}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Replace
              </DropdownMenuItem>

              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  deleteDoc(doc.id, {
                    onSuccess: () =>
                      toast.success("Document deleted successfully"),
                    onError: (e: any) =>
                      toast.error(e.message || "Delete failed"),
                  })
                }
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              updateDoc(
                { document_type: docType, file },
                {
                  onSuccess: () =>
                    toast.success("Document updated successfully"),
                  onError: (e: any) =>
                    toast.error(e.message || "Update failed"),
                }
              );
            }}
          />
        </div>
      </div>

      {/* Document Viewer Modal/Overlay */}
      {isViewing && data?.presigned_url && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative w-full h-full max-w-7xl max-h-[90vh] flex flex-col bg-white rounded-lg overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-white">
              <div>
                <h3 className="font-medium capitalize">
                  {docType.replace(/_/g, " ")}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {doc.file_path.split("/").pop()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenInNewTab}
                  disabled={!data?.presigned_url}
                >
                  Open in New Tab
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={closeViewer}
                  className="h-8 w-8"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Document Content - Responsive */}
            <div className="flex-1 overflow-auto p-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : isImage ? (
                <div className="flex items-center justify-center h-full">
                  <img
                    src={data.presigned_url}
                    alt={docType.replace(/_/g, " ")}
                    className="max-w-full max-h-full object-contain"
                    style={{
                      width: "auto",
                      height: "auto",
                      maxWidth: "100%",
                      maxHeight: "calc(90vh - 120px)",
                    }}
                  />
                </div>
              ) : isPdf ? (
                <div className="w-full h-full">
                  <iframe
                    src={data.presigned_url}
                    className="w-full h-full min-h-[500px]"
                    title={docType.replace(/_/g, " ")}
                    style={{
                      minHeight: "calc(90vh - 120px)",
                    }}
                  />
                </div>
              ) : (
                <div className="w-full h-full">
                  <iframe
                    src={data.presigned_url}
                    className="w-full h-full min-h-[500px]"
                    title={docType.replace(/_/g, " ")}
                    style={{
                      minHeight: "calc(90vh - 120px)",
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}