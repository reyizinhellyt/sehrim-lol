import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";

const governorState = vi.hoisted(() => ({
  data: [] as Array<{ cityCode: string; brandName: string; website: string; message: string; logoUrl?: string }>,
  former: [] as Array<{ cityCode: string; brandName: string; website: string; message: string; changeType: "replaced" | "removed" | "revoked"; archivedAt: Date; logoUrl?: string }>,
}));

vi.mock("@/lib/trpc", () => ({ trpc: { cityGovernorApplications: {
  approvedSponsors: { useQuery: () => ({ data: governorState.data, isLoading: false }) },
  formerSponsors: { useQuery: () => ({ data: governorState.former, isLoading: false }) },
} } }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button type="button">Tema</button> }));

import { cleanup, render, screen } from "@testing-library/react";
import Governors from "./Governors";

afterEach(() => { cleanup(); governorState.data = []; governorState.former = []; });

describe("Tüm Vali Listesi sayfası", () => {
  it("tüm onaylı sponsorları şehir ve public marka verileriyle listeler", () => {
    governorState.data = [
      { cityCode: "06", brandName: "Ankara Markası", website: "https://ornek.com/ankara", message: "Başkent kampanyası." },
      { cityCode: "01", brandName: "Adana Markası", website: "https://ornek.com/adana", message: "Akdeniz kampanyası.", logoUrl: "/manus-storage/adana.png" },
    ];
    render(<Governors />);
    const directory = screen.getByLabelText("Aktif Şehir Valileri");
    const pageTitle = screen.getByRole("heading", { level: 1 });
    expect(pageTitle.textContent).toContain("81 İlin");
    expect(pageTitle.textContent).toContain("Valileri.");
    expect(directory.textContent).toContain("Adana Valisi");
    expect(directory.textContent).toContain("Ankara Valisi");
    expect(directory.textContent).toContain("Başkent kampanyası.");
    expect(directory.querySelector(".governor-directory-city small")).toBeNull();
    expect(screen.getByRole("img", { name: "Adana Markası logosu" }).getAttribute("src")).toBe("/manus-storage/adana.png");
    const ankaraWebsite = screen.getByRole("link", { name: "Ankara Şehir Valisi Ankara Markası web sitesini yeni sekmede aç" });
    expect(ankaraWebsite.getAttribute("href")).toBe("https://ornek.com/ankara");
    expect(ankaraWebsite.getAttribute("target")).toBe("_blank");
    expect(ankaraWebsite.getAttribute("rel")).toContain("noopener");
    expect(ankaraWebsite.textContent).not.toContain("Siteyi ziyaret et");
    expect(directory.textContent).not.toContain("iletişim@");
  });

  it("hızlı filtrelerle aktif valileri, taht tarihçesini ve tüm şehirleri; aramayla şehir, vali veya plakayı gösterir", async () => {
    governorState.data = [
      { cityCode: "06", brandName: "Ankara Markası", website: "https://ornek.com/ankara", message: "Başkent kampanyası." },
      { cityCode: "01", brandName: "Adana Markası", website: "https://ornek.com/adana", message: "Akdeniz kampanyası." },
    ];
    const user = userEvent.setup();
    render(<Governors />);

    expect(screen.getByRole("button", { name: "Aktif Valiler" }).getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByLabelText("Aktif Şehir Valileri").textContent).toContain("Ankara Valisi");

    await user.click(screen.getByRole("button", { name: "Tüm Şehirler" }));
    const cityDirectory = screen.getByLabelText("81 ilin valilik durumu");
    expect(cityDirectory.textContent).toContain("Valilik alanı açık");

    await user.type(screen.getByPlaceholderText("Şehir, vali veya plaka ara"), "06");
    expect(cityDirectory.textContent).toContain("Ankara");
    expect(cityDirectory.textContent).not.toContain("Adana");

    await user.clear(screen.getByPlaceholderText("Şehir, vali veya plaka ara"));
    await user.click(screen.getByRole("button", { name: "Eski Valiler" }));
    expect(screen.getByText("Henüz eski vali kaydı yok.")).toBeTruthy();
  });

  it("Eski Valiler filtresinde public geçmiş kartını, değişiklik türünü ve aramayı gösterir", async () => {
    governorState.former = [{
      cityCode: "06",
      brandName: "Önceki Ankara Markası",
      website: "https://ornek.com/eski-ankara",
      message: "Geçmiş şehir valiliği kampanyası.",
      changeType: "replaced",
      archivedAt: new Date("2026-08-24T08:00:00.000Z"),
    }];
    const user = userEvent.setup();
    render(<Governors />);

    await user.click(screen.getByRole("button", { name: "Eski Valiler" }));
    const directory = screen.getByLabelText("Eski Valiler");
    expect(directory.textContent).toContain("Ankara Eski Valisi");
    expect(directory.textContent).toContain("Yeni valiyle değişti");
    const formerWebsite = screen.getByRole("link", { name: "Ankara eski Şehir Valisi Önceki Ankara Markası web sitesini yeni sekmede aç" });
    expect(formerWebsite.getAttribute("href")).toBe("https://ornek.com/eski-ankara");

    await user.type(screen.getByPlaceholderText("Şehir, vali veya plaka ara"), "06");
    expect(screen.getByLabelText("Eski Valiler").textContent).toContain("Önceki Ankara Markası");
  });

  it("onaylı sponsor yokken haritaya dönüş eylemi gösterir", () => {
    render(<Governors />);
    expect(screen.getByText("İlk Şehir Valisi bekleniyor.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Haritayı keşfet/i }).getAttribute("href")).toBe("/#yaris");
  });
});
