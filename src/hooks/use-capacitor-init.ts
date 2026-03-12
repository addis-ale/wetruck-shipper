"use client";

import { useEffect } from "react";

export function useCapacitorInit() {
  useEffect(() => {
    async function init() {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;

        const { StatusBar, Style } = await import("@capacitor/status-bar");
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setStyle({ style: Style.Light });
        await StatusBar.setBackgroundColor({ color: "#FFFFFF" });
      } catch {
        // Not running in Capacitor or plugin unavailable
      }
    }
    init();
  }, []);
}
