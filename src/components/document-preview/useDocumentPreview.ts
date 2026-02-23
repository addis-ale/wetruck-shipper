"use client";

import { useState, useCallback } from "react";

interface DocumentPreviewState {
  isOpen: boolean;
  url: string | null;
  title?: string;
  mimeType?: string | null;
}

export function useDocumentPreview() {
  const [state, setState] = useState<DocumentPreviewState>({
    isOpen: false,
    url: null,
    title: undefined,
    mimeType: undefined,
  });

  const open = useCallback(
    (url: string, title?: string, mimeType?: string | null) => {
      setState({ isOpen: true, url, title, mimeType });
    },
    [],
  );

  const close = useCallback(() => {
    setState({
      isOpen: false,
      url: null,
      title: undefined,
      mimeType: undefined,
    });
  }, []);

  return {
    isOpen: state.isOpen,
    url: state.url,
    title: state.title,
    mimeType: state.mimeType,
    open,
    close,
  };
}
