"use client";

import { useSyncExternalStore } from "react";
import {
  applyTheme,
  getPreferredTheme,
  getServerTheme,
  persistTheme,
  subscribeToTheme,
  type IweTheme,
} from "@/lib/client/theme";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useSyncExternalStore(subscribeToTheme, getPreferredTheme, getServerTheme);
  const isDark = theme === "dark";

  function handleToggle() {
    const nextTheme: IweTheme = isDark ? "light" : "dark";
    persistTheme(nextTheme);
    applyTheme(nextTheme);
  }

  return (
    <button
      type="button"
      className={className ?? "theme-toggle"}
      onClick={handleToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <i className={isDark ? "fas fa-sun" : "fas fa-moon"} aria-hidden="true" />
    </button>
  );
}
