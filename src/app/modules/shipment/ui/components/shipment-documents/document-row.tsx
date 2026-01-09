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
import { Loader2 } from "lucide-react";

import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";
import { useDeleteShipItemDocument } from "@/app/modules/shipment/server/hooks/use-delete-ship-item-document";
import { useUpdateShipItemDocument } from "@/app/modules/shipment/server/hooks/use-update-ship-item-document";
import { useShipItemDocumentPreview } from
  "@/app/modules/shipment/server/hooks/use-ship-item-document-preview";

export function DocumentRow({
  shipItemId,
  document,
}: {
  shipItemId: number;
  document: ShipItemDocument;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [docType, setDocType] = useState(document.document_type);
  const [shouldFetchPreview, setShouldFetchPreview] = useState(false);

  const { mutate: deleteDoc, isPending: isDeleting } =
    useDeleteShipItemDocument(shipItemId);

  const { mutate: updateDoc, isPending: isUpdating } =
    useUpdateShipItemDocument(shipItemId, document.id);

  const { data, isLoading, isError } = useShipItemDocumentPreview(
    shipItemId,
    document.id,
    shouldFetchPreview 
  );


  useEffect(() => {
    if (data?.presigned_url && shouldFetchPreview) {
  
      window.location.href = data.presigned_url;
    }
  }, [data, shouldFetchPreview]);

  const handleViewDocument = () => {
    if (data?.presigned_url) {

      window.location.href = data.presigned_url;
    } else {
   
      setShouldFetchPreview(true);
    }
  };

  return (
    <div className="border rounded-md">
      {/* Row */}
      <div className="flex items-center justify-between p-3">
        <div className="space-y-1">
          <p className="font-medium capitalize">
            {docType.replace(/_/g, " ")}
          </p>

          <p className="text-sm text-muted-foreground">
            {document.file_path.split("/").pop()}
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
                deleteDoc(document.id, {
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
  );
}