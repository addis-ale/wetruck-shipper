"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";

import type { ShipItemDocument } from "@/app/modules/shipment/server/types/ship-item-document";
import { useDeleteShipItemDocument } from "@/app/modules/shipment/server/hooks/use-delete-ship-item-document";
import { useUpdateShipItemDocument } from "@/app/modules/shipment/server/hooks/use-update-ship-item-document";
import { DocumentPreviewDialog } from "./document-preview-dialog";

export function DocumentRow({
  shipItemId,
  document,
}: {
  shipItemId: number;
  document: ShipItemDocument;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [docType, setDocType] = useState(document.document_type);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const { mutate: deleteDoc, isPending: isDeleting } =
    useDeleteShipItemDocument(shipItemId);

  const { mutate: updateDoc, isPending: isUpdating } =
    useUpdateShipItemDocument(shipItemId, document.id);

  return (
    <>
      {/* Row */}
      <div className="flex items-center justify-between border rounded p-3">
        <div className="space-y-1">
          <p className="font-medium capitalize">
            {docType.replace(/_/g, " ")}
          </p>

          <p className="text-sm text-muted-foreground">
            {document.file_path.split("/").pop()}
          </p>

          {/* Optional: allow changing type */}
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
            {/* View */}
            <DropdownMenuItem onClick={() => setPreviewOpen(true)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>

            {/* Edit / Replace */}
            <DropdownMenuItem
              disabled={isUpdating}
              onClick={() => fileRef.current?.click()}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Replace
            </DropdownMenuItem>

            {/* Delete */}
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setConfirmOpen(true)}
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
                onSuccess: () => {
                  toast.success("Document updated successfully");
                },
                onError: (err: any) => {
                  toast.error(err.message || "Failed to update document");
                },
              }
            );
          }}
        />
      </div>

      {/* Preview dialog */}
     
<DocumentPreviewDialog
  open={previewOpen}
  onOpenChange={setPreviewOpen}
  shipItemId={shipItemId}
  documentId={document.id}
  documentType={document.document_type}
/>

      {/* Delete confirmation modal */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete document</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this document? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>

            <Button
              variant="destructive"
              disabled={isDeleting}
              onClick={() => {
                deleteDoc(document.id, {
                  onSuccess: () => {
                    toast.success("Document deleted successfully");
                    setConfirmOpen(false);
                  },
                  onError: (err: any) => {
                    toast.error(err.message || "Failed to delete document");
                  },
                });
              }}
            >
              {isDeleting ? "Deleting..." : "Yes, delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
