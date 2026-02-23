/**
 * Brand primary green (matches CSS --primary) for in-app browser toolbar.
 */
const BRAND_TOOLBAR_COLOR = "#3daa5e";

/**
 * Opens a URL in an external browser / in-app browser overlay:
 * - On native: @capacitor/browser (SFSafariViewController / Chrome Custom Tabs).
 *   Fire-and-forget — we intentionally do NOT await Browser.open() because
 *   on some platforms the promise only resolves when the overlay is dismissed,
 *   which blocks the calling UI and makes it appear "pending forever".
 * - On web: window.open in a new tab.
 */
export async function openInBrowser(url: string): Promise<void> {
  if (typeof window === "undefined" || !url) return;

  try {
    const { Capacitor } = await import("@capacitor/core");
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import("@capacitor/browser");
      // Do NOT await — the promise may hang until the overlay is closed
      Browser.open({
        url,
        toolbarColor: BRAND_TOOLBAR_COLOR,
      });
    } else {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}
