import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

const authState = vi.hoisted(() => ({ user: { id: 1, name: "Yönetici", role: "admin" } as { id: number; name: string; role: string } | null }));
const applicationsUseQuery = vi.hoisted(() => vi.fn());
const reviewMutate = vi.hoisted(() => vi.fn());
const removeMutate = vi.hoisted(() => vi.fn());
const reopenMutate = vi.hoisted(() => vi.fn());

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user, loading: false }) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
vi.mock("@/components/ThemeToggle", () => ({ ThemeToggle: () => <button>Temayı değiştir</button> }));
vi.mock("@/lib/trpc", () => ({ trpc: { useUtils: () => ({ admin: { cityGovernorApplications: { invalidate: vi.fn() } } }), cityGovernorApplications: { attachmentUrl: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) } }, admin: { cityGovernorApplications: { useQuery: applicationsUseQuery }, reviewCityGovernorApplication: { useMutation: () => ({ mutate: reviewMutate, isPending: false }) }, removeApprovedCityGovernorApplication: { useMutation: () => ({ mutate: removeMutate, isPending: false }) }, reopenRemovedCityGovernorApplication: { useMutation: () => ({ mutate: reopenMutate, isPending: false }) } } } }));

import AdminGovernorApplications from "./AdminGovernorApplications";

afterEach(() => { cleanup(); vi.clearAllMocks(); authState.user = { id: 1, name: "Yönetici", role: "admin" }; });

describe("admin Şehir Valisi başvuru inceleme ekranı", () => {
  it("bekleyen başvuruyu iletişim bilgileri ve karar eylemleriyle listeler", () => {
    applicationsUseQuery.mockReturnValue({ data: [{ id: 9, cityCode: "06", brandName: "Örnek Marka", contactEmail: "iletisim@ornek.com", website: "https://ornek.com", message: "Sponsor alanı başvurusu.", attachmentName: "logo.pdf", status: "pending", applicantName: "Başvuru Sahibi", createdAt: new Date(), updatedAt: new Date() }], isLoading: false, isError: false });
    render(<AdminGovernorApplications />);
    expect(screen.getByText("Örnek Marka")).toBeTruthy();
    expect(screen.getByText("Başvuru Sahibi")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Onayla" })).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Reddet" }));
    expect(reviewMutate).toHaveBeenCalledWith({ applicationId: 9, status: "rejected", decisionNote: undefined }, expect.any(Object));
  });

  it("normal kullanıcıya yönetim alanını kapatır", () => {
    authState.user = { id: 7, name: "Üye", role: "user" };
    render(<AdminGovernorApplications />);
    expect(screen.getByText("Bu alan için yetkin yok.")).toBeTruthy();
  });

  it("onaylı sponsoru yayından kaldırıp kaldırılan kaydı yeniden incelemeye alabilir", () => {
    applicationsUseQuery.mockReturnValue({ data: [{ id: 12, cityCode: "06", brandName: "Aktif Marka", contactEmail: "iletisim@ornek.com", website: "https://ornek.com", message: "Onaylı sponsor içeriği.", status: "approved", applicantName: "Başvuru Sahibi", createdAt: new Date(), updatedAt: new Date(), reviewedAt: new Date() }], isLoading: false, isError: false });
    const { rerender } = render(<AdminGovernorApplications />);
    fireEvent.click(screen.getByRole("button", { name: "Yayından kaldır" }));
    expect(removeMutate).toHaveBeenCalledWith({ applicationId: 12 }, expect.any(Object));

    applicationsUseQuery.mockReturnValue({ data: [{ id: 12, cityCode: "06", brandName: "Aktif Marka", contactEmail: "iletisim@ornek.com", website: "https://ornek.com", message: "Onaylı sponsor içeriği.", status: "removed", applicantName: "Başvuru Sahibi", createdAt: new Date(), updatedAt: new Date(), reviewedAt: new Date(), decisionNote: "Yönetici tarafından yayından kaldırıldı." }], isLoading: false, isError: false });
    rerender(<AdminGovernorApplications />);
    expect(screen.getAllByText("Yayından kaldırıldı").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Yeniden incelemeye al" }));
    expect(reopenMutate).toHaveBeenCalledWith({ applicationId: 12 }, expect.any(Object));
  });
});
