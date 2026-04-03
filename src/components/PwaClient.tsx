"use client";

import { useEffect } from "react";

export default function PwaClient() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // Installability should degrade gracefully if service worker registration fails.
      }
    };

    void register();
  }, []);

  return null;
}
