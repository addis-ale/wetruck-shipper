"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { useDocumentPreview } from "@/components/document-preview/useDocumentPreview";

const DocumentPreviewModal = dynamic(
  () =>
    import("@/components/document-preview/DocumentPreviewModal").then(
      (mod) => mod.DocumentPreviewModal,
    ),
  { ssr: false },
);

interface DocumentPreviewContextValue {
  openDocument: (url: string, title?: string, mimeType?: string | null) => void;
}

const DocumentPreviewContext =
  createContext<DocumentPreviewContextValue | null>(null);

export function DocumentPreviewProvider({ children }: { children: ReactNode }) {
  const preview = useDocumentPreview();

  const openDocument = useCallback(
    (url: string, title?: string, mimeType?: string | null) => {
      preview.open(url, title, mimeType);
    },
    [preview.open],
  );

  return (
    <DocumentPreviewContext.Provider value={{ openDocument }}>
      {children}
      <DocumentPreviewModal
        isOpen={preview.isOpen}
        url={preview.url}
        title={preview.title}
        mimeType={preview.mimeType}
        onClose={preview.close}
      />
    </DocumentPreviewContext.Provider>
  );
}

export function useDocumentPreviewContext(): DocumentPreviewContextValue {
  const ctx = useContext(DocumentPreviewContext);
  if (!ctx) {
    throw new Error(
      "useDocumentPreviewContext must be used within DocumentPreviewProvider",
    );
  }
  return ctx;
}
