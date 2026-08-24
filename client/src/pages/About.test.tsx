import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it } from "vitest";
import { ThemeProvider } from "@/contexts/ThemeContext";
import About from "./About";

afterEach(cleanup);

describe("Hakkımızda mobil menüsü", () => {
  it("açıldığında geçerli Hakkımızda bölümünü erişilebilir biçimde vurgular", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><About /></ThemeProvider>);

    const trigger = screen.getByRole("button", { name: "Menüyü aç" });
    trigger.focus();
    await user.keyboard("{Enter}");

    const navigation = screen.getByRole("navigation", { name: "Mobil sayfa menüsü" });
    const activeLink = within(navigation).getByRole("link", { name: "Hakkında" });
    expect(activeLink.classList.contains("is-active")).toBe(true);
    expect(activeLink.getAttribute("aria-current")).toBe("location");
  });
});

describe("referans uyarlamalı Hakkımızda içeriği", () => {
  it("platform anlatımını, dört temel özelliği ve açık kuralları sunar", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><About /></ThemeProvider>);

    expect(screen.getByRole("heading", { name: /81 şehrin sesi/i })).toBeTruthy();
    expect(screen.getByText("İnteraktif canlı harita")).toBeTruthy();
    expect(screen.getByText("Ücretsiz ve hızlı oy")).toBeTruthy();
    expect(screen.getByText("Şehrin Valisi alanı")).toBeTruthy();
    expect(screen.getByText("Adil ve şeffaf yarış")).toBeTruthy();
    expect(screen.getByText("Hesapsız oy")).toBeTruthy();
    expect(screen.getByText("Günlük sınır")).toBeTruthy();
    expect(screen.getByText("Ortak Wi‑Fi notu")).toBeTruthy();
    expect(screen.getByText(/Okul, iş yeri veya misafir ağlarında aynı bağlantı paylaşılır/i)).toBeTruthy();
  });

  it("oy, sıralama ve şehir valileri için açıklayıcı yönlendirmeler sunar", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><About /></ThemeProvider>);

    expect(screen.getAllByRole("link", { name: /Sıralamaya dön/i })[0].getAttribute("href")).toBe("/");
    expect(screen.getByRole("link", { name: /Şehrine oy ver/i }).getAttribute("href")).toBe("/#yaris");
    const note = screen.getByText(/Şehir Valisi başvuruları yönetici onayından geçer/i).parentElement;
    expect(within(note!).getByRole("link", { name: /Şehir Valilerini incele/i }).getAttribute("href")).toBe("/valiler");
  });
});
