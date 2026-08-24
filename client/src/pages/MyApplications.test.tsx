import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ user: { id: 7, name: "Başvuru Sahibi", role: "user" } as { id: number; name: string; role: string } | null }));
const mineUseQuery = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user, loading: false }) }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button>Temayı değiştir</button> }));
vi.mock("@/const", () => ({ startLogin: vi.fn() }));
vi.mock("@/lib/trpc", () => ({ trpc: { cityGovernorApplications: { mine: { useQuery: mineUseQuery }, attachmentUrl: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } } } }));

import MyApplications from "./MyApplications";

afterEach(() => { cleanup(); vi.clearAllMocks(); authState.user = { id: 7, name: "Başvuru Sahibi", role: "user" }; });

describe("Başvurularım", () => {
  it("kullanıcının kendi başvurusu, durum ve yönetici notunu gösterir", () => {
    mineUseQuery.mockReturnValue({ data: [{ id: 4, cityCode: "06", brandName: "Örnek Marka", contactEmail: "iletisim@ornek.com", website: "https://ornek.com", message: "Görünür kampanya alanı istiyoruz.", attachmentName: "logo.png", status: "approved", decisionNote: "İçerik uygun bulundu.", createdAt: new Date(), updatedAt: new Date() }], isLoading: false, isError: false });
    render(<MyApplications />);
    expect(screen.getByRole("heading", { name: /Başvurularım/i })).toBeTruthy();
    expect(screen.getByText("Örnek Marka")).toBeTruthy();
    expect(screen.getByText("Onaylandı")).toBeTruthy();
    expect(screen.getByText("İçerik uygun bulundu.")).toBeTruthy();
    expect(screen.getByRole("button", { name: /logo\.png/i })).toBeTruthy();
  });

  it("oturum yoksa başvuruları göstermeden giriş istemi sunar", () => {
    authState.user = null;
    render(<MyApplications />);
    expect(screen.getByText("Başvurularını görmek için giriş yap.")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Kayıt ol / Giriş yap" })).toBeTruthy();
  });
});
