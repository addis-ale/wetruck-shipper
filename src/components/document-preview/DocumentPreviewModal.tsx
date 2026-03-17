"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  X,
  Download,
  ExternalLink,
  Loader2,
  FileQuestion,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { openInBrowser } from "@/lib/open-in-browser";
import { getDocumentType } from "@/lib/utils/document-utils";
import { fetchDocumentData } from "@/lib/utils/fetch-document";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

type ReactPdfComponents = {
  Document: typeof import("react-pdf").Document;
  Page: typeof import("react-pdf").Page;
};

let pdfModulePromise: Promise<ReactPdfComponents> | null = null;

function loadReactPdf(): Promise<ReactPdfComponents> {
  if (!pdfModulePromise) {
    pdfModulePromise = Promise.all([
      import("react-pdf"),
      import("react-pdf/dist/Page/AnnotationLayer.css" as string),
      import("react-pdf/dist/Page/TextLayer.css" as string),
    ]).then(([mod]) => {
      if (mod.pdfjs.GlobalWorkerOptions) {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      }
      return { Document: mod.Document, Page: mod.Page };
    });
  }
  return pdfModulePromise;
}

/**
 * Download a file natively on Capacitor (saves to device + opens share sheet)
 * or via anchor tag on web.
 */
async function downloadFile(
  url: string,
  fileName: string,
  existingData?: Uint8Array | null,
) {
  let isNative = false;
  try {
    const { Capacitor } = await import("@capacitor/core");
    isNative = Capacitor.isNativePlatform();
  } catch {
    // not native
  }

  if (!isNative) {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // --- Native: save to filesystem then open with native viewer ---
  try {
    toast.info("Saving file…");
    const { Filesystem, Directory } = await import("@capacitor/filesystem");

    let base64Data: string;

    if (existingData && existingData.length > 0) {
      let binary = "";
      for (let i = 0; i < existingData.length; i++) {
        binary += String.fromCharCode(existingData[i]);
      }
      base64Data = btoa(binary);
    } else {
      const { CapacitorHttp } = await import("@capacitor/core");
      const resp = await CapacitorHttp.get({ url, responseType: "blob" });
      if (resp.status < 200 || resp.status >= 300 || !resp.data) {
        throw new Error("Download failed");
      }
      base64Data =
        typeof resp.data === "string" ? resp.data : String(resp.data);
      if (base64Data.startsWith("data:")) {
        const idx = base64Data.indexOf(",");
        if (idx !== -1) base64Data = base64Data.slice(idx + 1);
      }
    }

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Cache,
    });

    // Detect MIME type from extension
    const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
    const mimeMap: Record<string, string> = {
      pdf: "application/pdf",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
    };
    const contentType = mimeMap[ext] || "application/octet-stream";

    // Open with native "Open with" dialog (ACTION_VIEW intent)
    const { FileOpener } = await import("@capacitor-community/file-opener");
    await FileOpener.open({
      filePath: savedFile.uri,
      contentType,
    });
  } catch (err) {
    console.warn("[downloadFile] native download failed:", err);
    toast.error("Download failed. Try opening in browser instead.");
  }
}

export interface DocumentPreviewModalProps {
  isOpen: boolean;
  url: string | null;
  title?: string;
  mimeType?: string | null;
  onClose: () => void;
  onDownload?: (url: string) => void;
}

export function DocumentPreviewModal({
  isOpen,
  url,
  title = "Document preview",
  mimeType,
  onClose,
  onDownload,
}: DocumentPreviewModalProps) {
  const { t } = useTranslation(["container", "common"]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageWidth, setPageWidth] = useState(400);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [useIframe, setUseIframe] = useState(false);
  const [pdfComponents, setPdfComponents] = useState<ReactPdfComponents | null>(
    null,
  );
  const fetchIdRef = useRef(0);

  const documentType = url
    ? getDocumentType(url, mimeType, title)
    : "unsupported";
  const canPreview =
    url && (documentType === "image" || documentType === "pdf");
  const showFallback =
    !canPreview || error !== null || (documentType === "image" && imageError);

  const resetState = useCallback(() => {
    setLoading(true);
    setError(null);
    setImageError(false);
    setNumPages(null);
    setPageNumber(1);
    setPdfData(null);
    setPdfBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setUseIframe(false);
  }, []);

  useEffect(() => {
    if (isOpen && url) resetState();
  }, [isOpen, url, resetState]);

  // Lazy-load react-pdf when a PDF needs to be displayed
  useEffect(() => {
    if (!isOpen || documentType !== "pdf") return;
    let cancelled = false;
    loadReactPdf()
      .then((comps) => {
        if (!cancelled) setPdfComponents(comps);
      })
      .catch((err) => {
        console.warn("[DocumentPreview] Failed to load react-pdf:", err);
        if (!cancelled) {
          setError(t("container:document_preview.pdf_load_failed"));
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, documentType]);

  // Fetch PDF bytes via CapacitorHttp on native, fetch on web
  useEffect(() => {
    if (!isOpen || !url || documentType !== "pdf") return;

    const id = ++fetchIdRef.current;

    fetchDocumentData(url).then((data) => {
      if (id !== fetchIdRef.current) return;
      if (data && data.length > 0) {
        setPdfData(data);
      } else {
        setUseIframe(true);
        setLoading(false);
      }
    });
  }, [isOpen, url, documentType]);

  // Use full screen width for pages (no gap on mobile)
  useEffect(() => {
    const updateWidth = () => {
      setPageWidth(
        Math.min(typeof window !== "undefined" ? window.innerWidth : 400, 800),
      );
    };
    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isOpen]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) onClose();
    },
    [onClose],
  );

  const handleDownload = useCallback(() => {
    if (!url) return;
    if (onDownload) {
      onDownload(url);
      return;
    }
    const fileName = title || "document";
    downloadFile(url, fileName, pdfData);
  }, [url, title, onDownload, pdfData]);

  const handleOpenInBrowser = useCallback(async () => {
    if (url) await openInBrowser(url);
  }, [url]);

  if (!url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className={cn(
          "fixed inset-0 z-50 flex h-full max-h-none w-full max-w-none translate-x-0 translate-y-0 flex-col gap-0 rounded-none border-0 p-0",
          "bg-black/95 focus:outline-none",
        )}
        aria-labelledby="document-preview-title"
      >
        {/* ── Header bar ── */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/50 px-3 py-2 safe-area-top">
          <DialogTitle id="document-preview-title" className="sr-only">
            {t("container:document_preview.title")}
          </DialogTitle>
          <span
            className="truncate text-sm text-white/90"
            title={title || undefined}
          >
            {title}
          </span>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
              onClick={handleDownload}
              aria-label="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
              onClick={handleOpenInBrowser}
              aria-label="Open in browser"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-white hover:bg-white/10 hover:text-white"
              onClick={onClose}
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* ── Content area ── */}
        <div className="relative flex-1 overflow-auto min-h-0 flex flex-col items-center justify-center p-4">
          {showFallback ? (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-white/10 bg-white/5 p-8 text-center">
              <FileQuestion className="h-12 w-12 text-white/50" />
              <p className="text-sm text-white/80">
                {documentType === "unsupported"
                  ? t("container:document_preview.preview_not_available")
                  : error || (documentType === "image" && imageError)
                    ? t("container:document_preview.could_not_load")
                    : t("container:document_preview.preview_failed")}
              </p>
              {error && (
                <p className="text-xs text-white/40 font-mono break-all">
                  {error}
                </p>
              )}
              <p className="text-xs text-white/60">
                {t("container:document_preview.restricted_hint")}
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" />
                  {t("common:buttons.download")}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleOpenInBrowser}
                >
                  <ExternalLink className="h-4 w-4 mr-1" />
                  {t("container:document_preview.open_in_browser")}
                </Button>
              </div>
            </div>
          ) : documentType === "image" ? (
            <div className="flex items-center justify-center max-h-full w-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              )}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={title}
                className="max-h-full max-w-full object-contain"
                onLoad={() => setLoading(false)}
                onError={() => {
                  setImageError(true);
                  setLoading(false);
                }}
              />
            </div>
          ) : documentType === "pdf" ? (
            <div className="flex flex-col items-center w-full max-h-full">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 z-10">
                  <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
              )}

              {/* Path A: react-pdf with raw bytes */}
              {pdfComponents && pdfData && !pdfBlobUrl && (
                <pdfComponents.Document
                  file={{ data: pdfData.slice() }}
                  onLoadSuccess={({ numPages: n }) => {
                    setNumPages(n);
                    setLoading(false);
                  }}
                  onLoadError={(e) => {
                    console.warn(
                      "[DocumentPreview] react-pdf failed, falling back to blob iframe:",
                      e?.message,
                    );
                    const blob = new Blob([pdfData.slice() as BlobPart], {
                      type: "application/pdf",
                    });
                    setPdfBlobUrl(URL.createObjectURL(blob));
                  }}
                  loading={null}
                  className="flex flex-col items-center w-full"
                >
                  <div className="bg-white rounded overflow-auto w-full flex justify-center">
                    <pdfComponents.Page
                      pageNumber={pageNumber}
                      width={pageWidth}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={null}
                    />
                  </div>

                  {/* Page navigation */}
                  {numPages !== null && numPages > 1 && (
                    <div className="flex items-center gap-3 shrink-0 pt-3 w-full justify-center">
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled={pageNumber <= 1}
                        onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
                        aria-label="Previous page"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-white/90 tabular-nums">
                        {pageNumber} / {numPages}
                      </span>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-white/10 border-white/20 text-white hover:bg-white/20"
                        disabled={pageNumber >= numPages}
                        onClick={() =>
                          setPageNumber((p) => Math.min(numPages, p + 1))
                        }
                        aria-label="Next page"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </pdfComponents.Document>
              )}

              {/* Path B: blob URL iframe (react-pdf failed but we have data) */}
              {pdfBlobUrl && (
                <iframe
                  src={pdfBlobUrl}
                  title="PDF document"
                  className="w-full flex-1 border-0 bg-white"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setError(t("container:document_preview.pdf_display_failed"));
                    setLoading(false);
                  }}
                />
              )}

              {/* Path C: fetch failed (CORS on desktop) → iframe with presigned URL */}
              {useIframe && !pdfData && !pdfBlobUrl && (
                <iframe
                  src={url}
                  title="PDF document"
                  className="w-full flex-1 border-0 bg-white"
                  onLoad={() => setLoading(false)}
                  onError={() => {
                    setError(t("container:document_preview.pdf_load_error"));
                    setLoading(false);
                  }}
                />
              )}
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
