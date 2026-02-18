"use client";

import { useRef, useState, useCallback } from "react";
import { Loader2, X, FileText, CloudUpload } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface UploadDocumentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (file: File, documentType: string) => Promise<void>;
  isUploading: boolean;
}

export function UploadDocumentModal({
  isOpen,
  onOpenChange,
  onUpload,
  isUploading,
}: UploadDocumentModalProps) {
  const isMobile = useIsMobile();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documentType, setDocumentType] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/jpg",
      "image/png",
    ];

    if (!validTypes.includes(file.type)) {
      setError(
        "Invalid file type. Please upload PDF, DOC, DOCX, JPG, or PNG files.",
      );
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      setError("File size exceeds 10MB limit. Please choose a smaller file.");
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select a file");
      return;
    }

    if (!documentType.trim()) {
      setError("Please select a document type");
      return;
    }

    setError(null);
    setSelectedFile(null);
    setDocumentType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onOpenChange(false);
    onUpload(selectedFile, documentType.trim());
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setDocumentType("");
      setError(null);
      setIsDragging(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      onOpenChange(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  const formContent = (
    <>
      <div className="space-y-6 py-2">
        <div className="space-y-2">
          <Label htmlFor="document-type" className="text-sm font-medium">
            Document Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={documentType}
            onValueChange={(value) => {
              setDocumentType(value);
              setError(null);
            }}
            disabled={isUploading}
          >
            <SelectTrigger
              id="document-type"
              className="h-11 w-full rounded-lg"
            >
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TRADE_LICENCE">Trade Licence</SelectItem>
              <SelectItem value="AUTHORISED_CONTACT_PERSON_COMPANY_ID">
                Authorised Contact Person Company ID
              </SelectItem>
              <SelectItem value="OTHER">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">File Upload</Label>
          <input
            ref={fileInputRef}
            id="file"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            disabled={isUploading}
          />

          {!selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={cn(
                "relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer bg-muted/30",
                "hover:border-primary hover:bg-primary/5",
                isDragging && "border-primary bg-primary/10",
                isUploading && "opacity-50 cursor-not-allowed",
              )}
              onClick={handleFileSelect}
            >
              <div className="flex flex-col items-center justify-center gap-4 text-center">
                <div className="rounded-full p-3 bg-primary/10 text-primary">
                  <CloudUpload className="h-10 w-10" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PDF, JPG or PNG (max. 10MB)
                  </p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  className="mt-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFileSelect();
                  }}
                >
                  Select File
                </Button>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center gap-3">
                <div className="shrink-0">{getFileIcon()}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                  className="h-8 w-8 shrink-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </div>
    </>
  );

  function getFileIcon() {
    return <FileText className="h-5 w-5 text-muted-foreground" />;
  }

  const footerContent = (
    <>
      <Button variant="outline" onClick={handleClose} disabled={isUploading}>
        Cancel
      </Button>
      <Button
        onClick={handleUpload}
        disabled={!selectedFile || !documentType || isUploading}
        className="min-w-[140px] bg-primary hover:bg-primary/90"
      >
        {isUploading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <FileText className="h-4 w-4 mr-2" />
            Upload Document
          </>
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
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-12 h-1 rounded-full bg-muted-foreground/30" />
          </div>
          <SheetHeader className="px-6 pb-2 text-left">
            <div className="flex items-start justify-between gap-4 pr-8">
              <SheetTitle className="text-xl font-bold">
                Upload Document
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-xl">Upload Document</DialogTitle>
        </DialogHeader>
        {formContent}
        <DialogFooter className="flex justify-between gap-2">
          {footerContent}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
