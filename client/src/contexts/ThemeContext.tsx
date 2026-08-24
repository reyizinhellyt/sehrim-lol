import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";
type ThemeSource = "system" | "manual" | "preview";

interface ThemeContextType {
  theme: Theme;
  toggleTheme?: () => void;
  switchable: boolean;
}

function getSystemTheme(fallback: Theme): Theme {
  if (typeof window === "undefined" || !window.matchMedia) return fallback;
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

function getRequestedTheme(): Theme | null {
  if (typeof window === "undefined") return null;
  const requested = new URLSearchParams(window.location.search).get("theme");
  return requested === "light" || requested === "dark" ? requested : null;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}

export function ThemeProvider({
  children,
  defaultTheme = "light",
  switchable = false,
}: ThemeProviderProps) {
  const requestedTheme = getRequestedTheme();
  const storedTheme = switchable && typeof window !== "undefined" ? localStorage.getItem("theme") : null;
  const initialSource: ThemeSource = requestedTheme ? "preview" : storedTheme === "light" || storedTheme === "dark" ? "manual" : "system";
  const [source, setSource] = useState<ThemeSource>(initialSource);
  const [theme, setTheme] = useState<Theme>(() => {
    if (switchable) {
      if (requestedTheme === "light" || requestedTheme === "dark") return requestedTheme;
      return storedTheme === "light" || storedTheme === "dark" ? storedTheme : getSystemTheme(defaultTheme);
    }
    return defaultTheme;
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.classList.toggle("light", theme === "light");

    if (switchable && source === "manual") {
      localStorage.setItem("theme", theme);
    }
  }, [source, theme, switchable]);

  useEffect(() => {
    if (!switchable || source !== "system" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const updateFromSystem = (event: MediaQueryListEvent) => setTheme(event.matches ? "light" : "dark");
    media.addEventListener("change", updateFromSystem);
    return () => media.removeEventListener("change", updateFromSystem);
  }, [source, switchable]);

  const toggleTheme = switchable
      ? () => {
        setSource("manual");
        setTheme(prev => (prev === "light" ? "dark" : "light"));
      }
    : undefined;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, switchable }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
