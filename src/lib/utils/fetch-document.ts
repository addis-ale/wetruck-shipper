/**
 * Fetches a document as binary data.
 *
 * On native (Capacitor):
 *   The patched fetch()'s `response.arrayBuffer()` does NOT reliably return
 *   binary data — it corrupts the bytes because the native layer converts the
 *   response through a string encoding.  We therefore use `CapacitorHttp.get()`
 *   directly with `responseType: "blob"`, which returns a base64 string that
 *   we decode losslessly.
 *
 * On web:
 *   Regular fetch (subject to CORS). Returns null on failure so the caller
 *   can fall back to an iframe (desktop browsers have built-in PDF viewers).
 *
 * Returns a Uint8Array of the file bytes, or null if the fetch fails.
 */
export async function fetchDocumentData(
  url: string,
): Promise<Uint8Array | null> {
  if (!url) return null;

  // ---------- Native path (CapacitorHttp.get) ----------
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { CapacitorHttp } = await import("@capacitor/core");
      const resp = await CapacitorHttp.get({
        url,
        responseType: "blob",
      });

      if (resp.status >= 200 && resp.status < 300 && resp.data) {
        let base64 =
          typeof resp.data === "string" ? resp.data : String(resp.data);

        // Strip data-URL prefix if the plugin returns one
        if (base64.startsWith("data:")) {
          const commaIdx = base64.indexOf(",");
          if (commaIdx !== -1) base64 = base64.slice(commaIdx + 1);
        }

        // Remove any whitespace / line breaks
        base64 = base64.replace(/\s/g, "");

        if (base64.length > 0) {
          const binaryString = atob(base64);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          if (bytes.length > 0) return bytes;
        }
      }

      // On native, the regular fetch() is also patched by CapacitorHttp and
      // has the same arrayBuffer() issue, so there is no point falling through.
      return null;
    }
  } catch (err) {
    console.warn("[fetchDocumentData] native CapacitorHttp.get failed:", err);
    // Not on native or import failed — fall through to web fetch
  }

  // ---------- Web path (regular fetch) ----------
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    return new Uint8Array(buffer);
  } catch {
    return null;
  }
}
