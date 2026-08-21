const THEME_KEY = "scheduling-visualizer.theme";

type Theme = "light" | "dark";

function setHtmlTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

export function getStoredTheme(): Theme | null {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "dark" ? "dark" : v === "light" ? "light" : null;
  } catch (e) {
    return null;
  }
}

export function storeTheme(theme: Theme | null) {
  try {
    if (theme === null) localStorage.removeItem(THEME_KEY);
    else localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore
  }
}

export function systemPrefersDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

export function initTheme() {
  if (typeof window === "undefined") return;
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  setHtmlTheme(mq.matches ? "dark" : "light");

  // always follow system changes (no user override persisted)
  const listener = (ev: MediaQueryListEvent) => {
    setHtmlTheme(ev.matches ? "dark" : "light");
  };
  try {
    mq.addEventListener("change", listener);
  } catch (e) {
    // Safari fallback
    try {
      // @ts-ignore
      mq.addListener(listener);
    } catch (e2) {
      // ignore
    }
  }
}

export function setTheme(theme: Theme | null) {
  // Keep API but do not persist user choice; directly apply theme when called.
  if (theme === null) {
    setHtmlTheme(systemPrefersDark() ? "dark" : "light");
    return;
  }
  setHtmlTheme(theme);
}

export function toggleTheme() {
  // toggle remains, but will not persist user preference.
  const current =
    (document.documentElement.getAttribute("data-theme") as Theme) ||
    (systemPrefersDark() ? "dark" : "light");
  setTheme(current === "dark" ? "light" : "dark");
}

export function currentTheme(): Theme {
  return (
    (document.documentElement.getAttribute("data-theme") as Theme) ||
    (systemPrefersDark() ? "dark" : "light")
  );
}

export default {
  initTheme,
  setTheme,
  getStoredTheme,
  toggleTheme,
  currentTheme,
};
