"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import type { OrganizationDocument } from "@/lib/api/organization";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslation } from "react-i18next";

interface EditDocumentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  document: OrganizationDocument | null;
  onUpdate: (
    id: string | number,
    data: { document_type?: string; file?: File },
  ) => Promise<void>;
  isUpdating: boolean;
}

export function EditDocumentModal({
  isOpen,
  onOpenChange,
  document,
  onUpdate,
  isUpdating,
}: EditDocumentModalProps) {
  const { t } = useTranslation(["organization", "common"]);
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (document) {
      const docType = document.document_type?.toUpperCase() || "";
      setDocumentType(docType);
      setSelectedFile(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [document]);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  };

  const handleUpdate = async () => {
    if (!document) return;

    if (!documentType.trim()) {
      setError(t("organization:edit_modal.select_type_error"));
      return;
    }

    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
    onUpdate(document.id, {
      document_type: documentType.trim(),
      file: selectedFile || undefined,
    });
  };

  const handleClose = () => {
    if (!isUpdating) {
      setSelectedFile(null);
      setError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  if (!document) return null;

  const formContent = (
    <div className="space-y-4 py-2">
      <div className="space-y-2">
        <Label htmlFor="edit-document-type">{t("organization:edit_modal.document_type")}</Label>
        <Select
          value={documentType}
          onValueChange={(value) => {
            setDocumentType(value);
            setError(null);
          }}
          disabled={isUpdating}
        >
          <SelectTrigger
            id="edit-document-type"
            className="h-11 w-full rounded-lg"
          >
            <SelectValue placeholder={t("organization:edit_modal.select_type")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TRADE_LICENCE">{t("common:document_types.trade_licence")}</SelectItem>
            <SelectItem value="AUTHORISED_CONTACT_PERSON_COMPANY_ID">
              {t("common:document_types.authorised_contact_person_company_id")}
            </SelectItem>
            <SelectItem value="OTHER">{t("common:document_types.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-file">{t("organization:edit_modal.replace_file")}</Label>
        <input
          ref={fileInputRef}
          id="edit-file"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          disabled={isUpdating}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleFileSelect}
          disabled={isUpdating}
          className="w-full h-11"
        >
          {selectedFile ? (
            <>
              <X className="h-4 w-4 mr-2" />
              {selectedFile.name}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {t("organization:edit_modal.select_new_file")}
            </>
          )}
        </Button>
        {selectedFile && (
          <p className="text-xs text-muted-foreground">
            New file: {selectedFile.name} (
            {(selectedFile.size / 1024).toFixed(2)} KB)
          </p>
        )}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const footerContent = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
        {t("common:buttons.cancel")}
      </Button>
      <Button
        onClick={handleUpdate}
        disabled={!documentType || isUpdating}
        className="bg-primary hover:bg-primary/90"
      >
        {isUpdating ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            {t("organization:edit_modal.updating")}
          </>
        ) : (
          t("organization:edit_modal.update")
        )}
      </Button>
    </>
  );

  // Mobile: bottom sheet
  if (isMobile) {
    return (
      <Sheet open={isOpen} onOpenChange={handleClose}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-t flex flex-col p-0 pb-safe"
        >
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetHeader className="px-6 pb-2 text-left">
            <div className="flex items-start justify-between gap-4 pr-8">
              <SheetTitle className="text-xl font-bold">
                {t("organization:edit_modal.title")}
              </SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto px-6">{formContent}</div>
          <SheetFooter className="flex flex-row justify-between gap-2 border-t p-4">
            {footerContent}
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: centered dialog
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{t("organization:edit_modal.title")}</DialogTitle>
        </DialogHeader>
        {formContent}
        <DialogFooter className="flex justify-between gap-2">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
