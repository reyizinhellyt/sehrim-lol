import React from "react";
import { describe, expect, it, vi } from "vitest";

const hallState = vi.hoisted(() => ({ data: [] as Array<{ cityCode: string; cityRank: number; totalPoints: number; recordDate: string }> }));

vi.mock("@/lib/trpc", () => ({ trpc: { game: { hallOfFame: { useQuery: () => ({ data: hallState.data, isLoading: false }) } } } }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button type="button">Tema</button> }));

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach } from "vitest";
import Champions from "./Champions";

afterEach(() => { cleanup(); hallState.data = []; });

describe("Tüm Şampiyonlar sayfası", () => {
  it("arşivdeki tüm şehir kayıtlarını sıraları, puanları ve tarihleriyle gösterir", () => {
    hallState.data = [
      { cityCode: "06", cityRank: 1, totalPoints: 42, recordDate: "2026-08-22" },
      { cityCode: "01", cityRank: 2, totalPoints: 28, recordDate: "2026-08-22" },
      { cityCode: "34", cityRank: 3, totalPoints: 19, recordDate: "2026-08-22" },
    ];
    render(<Champions />);
    expect(screen.getByRole("heading", { name: /Şehirlerin/i })).toBeTruthy();
    expect(screen.getByText("Ankara")).toBeTruthy();
    expect(screen.getByText("Adana")).toBeTruthy();
    expect(screen.getByText("İstanbul")).toBeTruthy();
    expect(screen.getAllByText("2026-08-22")).toHaveLength(3);
  });

  it("arşiv boşken yarışa dönüş çağrısı gösterir", () => {
    render(<Champions />);
    expect(screen.getByText("İlk şampiyonlar bekleniyor.")).toBeTruthy();
    expect(screen.getByRole("link", { name: /Yarışı keşfet/i }).getAttribute("href")).toBe("/#yaris");
  });
});
