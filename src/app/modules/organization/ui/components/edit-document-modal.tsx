"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

interface EditDocumentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  document: OrganizationDocument | null;
  onUpdate: (
    id: string | number,
    data: { document_type?: string; file?: File }
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize form when document changes
  useEffect(() => {
    if (document) {
      // Convert lowercase from backend to uppercase for UI consistency
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
      setError("Please select a document type");
      return;
    }

    setError(null);
    // Reset form optimistically
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    // Close modal optimistically - parent will handle success/error
    onOpenChange(false);
    // Call onUpdate (it now handles the mutation and closes modal)
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Document</DialogTitle>
          <DialogDescription>
            Update document metadata or replace the file.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-document-type">Document Type</Label>
            <Select
              value={documentType}
              onValueChange={(value) => {
                setDocumentType(value);
                setError(null);
              }}
            >
              <SelectTrigger id="edit-document-type">
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TRADE_LICENCE">Trade Licence</SelectItem>
                <SelectItem value="AUTHORISED_CONTACT_PERSON_COMPANY_ID">Authorised Contact Person Company ID</SelectItem>
                <SelectItem value="OTHER">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-file">Replace File (Optional)</Label>
            <input
              ref={fileInputRef}
              id="edit-file"
              type="file"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleFileSelect}
                disabled={isUpdating}
                className="flex-1"
              >
                {selectedFile ? (
                  <>
                    <X className="h-4 w-4 mr-2" />
                    {selectedFile.name}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Select New File (Optional)
                  </>
                )}
              </Button>
            </div>
            {selectedFile && (
              <p className="text-xs text-muted-foreground">
                New file: {selectedFile.name} (
                {(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
            {!selectedFile && document.file_path && (
              <p className="text-xs text-muted-foreground">
                Current file:{" "}
                {document.file_path.split("/").pop() || document.file_path}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUpdating}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={!documentType || isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              "Update"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
