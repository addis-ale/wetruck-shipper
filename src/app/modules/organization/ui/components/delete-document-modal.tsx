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
import { useTranslation } from "react-i18next";

// formatDocumentType moved inside component to access t()

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
  const { t } = useTranslation(["organization", "common"]);

  const formatDocumentType = (type?: string) => {
    if (!type) return t("common:labels.documents");
    const typeUpper = type.toUpperCase();
    const typeMap: Record<string, string> = {
      TRADE_LICENCE: t("common:document_types.trade_licence"),
      AUTHORISED_CONTACT_PERSON_COMPANY_ID: t("common:document_types.authorised_contact_person_company_id"),
      OTHER: t("common:document_types.other"),
    };
    return typeMap[typeUpper] || type.replace(/_/g, " ");
  };

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
            {t("organization:delete_modal.title")}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {t("organization:delete_modal.confirm", { type: formatDocumentType(document.document_type) })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 gap-2 sm:gap-2 flex-col sm:flex-row">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {t("common:buttons.cancel")}
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
            {t("organization:delete_modal.title")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
