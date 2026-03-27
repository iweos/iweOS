export type IweTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "iweos-theme";

export function getPreferredTheme(): IweTheme {
  if (typeof window === "undefined") {
    return "light";
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (storedTheme === "light" || storedTheme === "dark") {
    return storedTheme;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme: IweTheme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  if (document.body) {
    document.body.dataset.theme = theme;
    document.body.dataset.backgroundColor = theme === "dark" ? "dark" : "light";
  }
}

export function persistTheme(theme: IweTheme) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}
