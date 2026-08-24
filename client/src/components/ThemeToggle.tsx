import { useTheme } from "@/contexts/ThemeContext";
import { Moon, Sun } from "lucide-react";
import React from "react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  if (!toggleTheme) return null;

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? "Gündüz moduna geç" : "Karanlık moda geç"}
      aria-pressed={isDark}
      title={isDark ? "Gündüz modu" : "Karanlık mod"}
    >
      <Sun className={isDark ? "theme-icon-muted" : "theme-icon-active"} size={16} />
      <Moon className={isDark ? "theme-icon-active" : "theme-icon-muted"} size={15} />
      <span className="sr-only">{isDark ? "Karanlık mod etkin" : "Gündüz mod etkin"}</span>
    </button>
  );
}
