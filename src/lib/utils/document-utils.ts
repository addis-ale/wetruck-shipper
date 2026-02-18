const IMG_EXTENSIONS = ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"];

const EXT_TO_MIME: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  bmp: "image/bmp",
  svg: "image/svg+xml",
};

/**
 * Convert a file extension (with or without leading dot) to a MIME type.
 * Returns null for unknown extensions.
 */
export function extToMimeType(ext: string | null | undefined): string | null {
  if (!ext) return null;
  const e = ext.toLowerCase().replace(/^\./, "");
  return EXT_TO_MIME[e] ?? null;
}

/**
 * Detect if a URL is likely a PDF based on extension or content-type.
 * Can use content-type from API when available via optional second arg.
 */
export function isPdfUrl(url: string, mimeType?: string | null): boolean {
  if (!url) return false;
  if (mimeType === "application/pdf") return true;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return path.endsWith(".pdf") || path.includes(".pdf?");
  } catch {
    return false;
  }
}

/**
 * Detect if a URL is likely an image.
 */
export function isImageUrl(url: string, mimeType?: string | null): boolean {
  if (!url) return false;
  if (mimeType?.startsWith("image/")) return true;
  try {
    const path = new URL(url).pathname.toLowerCase();
    return IMG_EXTENSIONS.some(
      (ext) => path.endsWith(`.${ext}`) || path.includes(`.${ext}?`),
    );
  } catch {
    return false;
  }
}

/** Extract a bare extension from a filename / path. */
function extractExt(name: string): string | undefined {
  const dot = name.lastIndexOf(".");
  if (dot === -1 || dot === name.length - 1) return undefined;
  return name.slice(dot + 1).toLowerCase();
}

export type DocumentType = "pdf" | "image" | "unsupported";

/**
 * Determine whether the document is a PDF, image, or unsupported.
 *
 * Checks (in order):
 * 1. Explicit mimeType
 * 2. URL path extension
 * 3. Optional fileName extension (e.g. the original upload name)
 */
export function getDocumentType(
  url: string,
  mimeType?: string | null,
  fileName?: string,
): DocumentType {
  if (isPdfUrl(url, mimeType)) return "pdf";
  if (isImageUrl(url, mimeType)) return "image";

  if (fileName) {
    const ext = extractExt(fileName);
    if (ext === "pdf") return "pdf";
    if (ext && IMG_EXTENSIONS.includes(ext)) return "image";
  }

  return "unsupported";
}
