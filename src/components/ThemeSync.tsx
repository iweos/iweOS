"use client";

import { useEffect } from "react";
import { applyTheme, getPreferredTheme } from "@/lib/client/theme";

export default function ThemeSync() {
  useEffect(() => {
    applyTheme(getPreferredTheme());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const storedTheme = window.localStorage.getItem("iweos-theme");
      if (storedTheme === "light" || storedTheme === "dark") {
        return;
      }
      applyTheme(mediaQuery.matches ? "dark" : "light");
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== "iweos-theme") {
        return;
      }

      applyTheme(getPreferredTheme());
    };

    mediaQuery.addEventListener("change", handleMediaChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  return null;
}
