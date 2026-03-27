"use client";

import { useEffect, useState } from "react";
import { applyTheme, getPreferredTheme, persistTheme, type IweTheme } from "@/lib/client/theme";

type ThemeToggleProps = {
  className?: string;
};

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const [theme, setTheme] = useState<IweTheme>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const resolvedTheme = getPreferredTheme();
    setTheme(resolvedTheme);
    applyTheme(resolvedTheme);
    setMounted(true);
  }, []);

  function handleToggle() {
    const nextTheme: IweTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    persistTheme(nextTheme);
    applyTheme(nextTheme);
  }

  const isDark = mounted ? theme === "dark" : false;

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
