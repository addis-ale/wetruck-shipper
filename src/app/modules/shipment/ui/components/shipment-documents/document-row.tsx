"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MoreVertical, Trash2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useDocumentPreviewContext } from "@/components/providers/DocumentPreviewProvider";
import { extToMimeType } from "@/lib/utils/document-utils";

import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";
import { useDeleteShipItemDocument } from "@/app/modules/shipment/server/hooks/use-delete-ship-item-document";
import { useUpdateShipItemDocument } from "@/app/modules/shipment/server/hooks/use-update-ship-item-document";
import { useShipItemDocumentPreview } from "@/app/modules/shipment/server/hooks/use-ship-item-document-preview";

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

  const { openDocument } = useDocumentPreviewContext();
  const { mutate: deleteDoc } = useDeleteShipItemDocument(shipItemId);

  const { mutate: updateDoc, isPending: isUpdating } =
    useUpdateShipItemDocument(shipItemId, doc.id);

  const { data, isLoading } = useShipItemDocumentPreview(
    shipItemId,
    doc.id,
    shouldFetchPreview,
    doc.container_id,
  );

  // Handle viewing the document
  const handleViewDocument = () => {
    setShouldFetchPreview(true);
  };

  useEffect(() => {
    if (data?.presigned_url && shouldFetchPreview) {
      openDocument(
        data.presigned_url,
        doc.file_path.split("/").pop() ?? undefined,
        extToMimeType(doc.file_ext),
      );
      setShouldFetchPreview(false);
    }
  }, [data, shouldFetchPreview, openDocument, doc.file_path, doc.file_ext]);

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

            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger className="h-8 w-[200px] text-xs">
                <SelectValue />
              </SelectTrigger>

              <SelectContent
                align="start"
                side="bottom"
                sideOffset={4}
                className="z-50"
              >
                <SelectItem value="proof_of_delivery">
                  Proof of Delivery
                </SelectItem>

                <SelectItem value="bill_of_lading">Bill of Lading</SelectItem>

                <SelectItem value="commercial_invoice">
                  Commercial Invoice
                </SelectItem>

                <SelectItem value="container_return_receipt">
                  Interchange Document (Return)
                </SelectItem>
              </SelectContent>
            </Select>
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
                    onError: (e: Error) =>
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
                  onError: (e: Error) =>
                    toast.error(e.message || "Update failed"),
                },
              );
            }}
          />
        </div>
      </div>
    </>
  );
}
