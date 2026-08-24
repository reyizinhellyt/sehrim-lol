import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ThemeProvider, useTheme } from "./ThemeContext";

const originalMatchMedia = window.matchMedia;

function mockSystemTheme(prefersLight: boolean) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: () => ({
      matches: prefersLight,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }),
  });
}

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme();
  return <button onClick={toggleTheme}>{theme}</button>;
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = "";
});

afterEach(() => {
  cleanup();
  Object.defineProperty(window, "matchMedia", { configurable: true, value: originalMatchMedia });
});

describe("tema tercihi", () => {
  it("koyu temayı varsayılan olarak başlatır ve kullanıcının gündüz tercihini saklar", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><ThemeProbe /></ThemeProvider>);

    expect(screen.getByRole("button").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);

    await user.click(screen.getByRole("button"));
    expect(screen.getByRole("button").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(localStorage.getItem("theme")).toBe("light");
  });

  it("manuel tercih yoksa cihazın gündüz temasını algılar", () => {
    mockSystemTheme(true);
    render(<ThemeProvider defaultTheme="dark" switchable><ThemeProbe /></ThemeProvider>);

    expect(screen.getByRole("button").textContent).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("kayıtlı manuel tercihi sistem temasına göre öncelikli tutar", () => {
    mockSystemTheme(true);
    localStorage.setItem("theme", "dark");
    render(<ThemeProvider defaultTheme="dark" switchable><ThemeProbe /></ThemeProvider>);

    expect(screen.getByRole("button").textContent).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
