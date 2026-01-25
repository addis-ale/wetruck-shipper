"use client";

import { Loader2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { OrganizationDocument } from "@/lib/api/organization";

const formatDocumentType = (type?: string) => {
  if (!type) return "document";
  // Handle both uppercase (from UI) and lowercase (from backend)
  const typeUpper = type.toUpperCase();
  const typeMap: Record<string, string> = {
    TRADE_LICENCE: "Trade Licence",
    AUTHORISED_CONTACT_PERSON_COMPANY_ID: "Authorised Contact Person Company ID",
    OTHER: "Other",
  };
  return typeMap[typeUpper] || type.replace(/_/g, " ");
};

interface DeleteDocumentModalProps {
  document: OrganizationDocument | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: (documentId: number) => Promise<void>;
  isDeleting: boolean;
}

export function DeleteDocumentModal({
  document,
  isOpen,
  onOpenChange,
  onDelete,
  isDeleting,
}: DeleteDocumentModalProps) {
  const handleDelete = async () => {
    if (!document) return;

    try {
      await onDelete(document.id);
      onOpenChange(false);
    } catch (err: unknown) {
      console.error("Failed to delete document:", err);
      // Modal stays open to show error message
    }
  };

  if (!document) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] max-w-[90vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive text-lg">
            <AlertTriangle className="h-5 w-5" />
            Delete Document
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to delete this{" "}
            <span className="font-bold text-primary">
              {formatDocumentType(document.document_type)}
            </span>
            ? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Delete Document
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
