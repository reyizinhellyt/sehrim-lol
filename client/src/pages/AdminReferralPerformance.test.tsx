import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts/ThemeContext";

const authState = vi.hoisted(() => ({
  user: { id: 1, openId: "admin-user", name: "Yönetici", email: "admin@example.com", loginMethod: "manus", role: "admin" as "admin" | "user", createdAt: new Date(), updatedAt: new Date(), lastSignedIn: new Date() },
}));

vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: authState.user, loading: false }) }));
vi.mock("@/components/DashboardLayout", () => ({ default: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
vi.mock("@/lib/trpc", () => ({ trpc: { admin: { cityGovernorReferralPerformance: { useQuery: () => ({ isLoading: false, isError: false, data: { totalLinks: 1, totalQualifiedSupporters: 3, entries: [{ applicationId: 4, cityCode: "06", brandName: "Ankara Markası", status: "pending", createdAt: new Date("2026-08-24T10:00:00.000Z"), qualifiedSupporters: 3 }] } }) } } } }));

import AdminReferralPerformance from "./AdminReferralPerformance";

afterEach(() => { cleanup(); authState.user.role = "admin"; });

describe("ayrı yönetici davet performansı sayfası", () => {
  it("yöneticiye toplu davet metriklerini ayrı sayfada gösterir", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><AdminReferralPerformance /></ThemeProvider>);
    const panel = screen.getByLabelText("Davet performansları");
    expect(panel.textContent).toContain("Aktif davet bağlantısı");
    expect(panel.textContent).toContain("Nitelikli yeni destek");
    expect(panel.textContent).toContain("Ankara Markası");
    expect(panel.textContent).not.toContain("@example.com");
  });

  it("normal kullanıcıya performans sayfasını göstermez", () => {
    authState.user.role = "user";
    render(<ThemeProvider defaultTheme="dark" switchable><AdminReferralPerformance /></ThemeProvider>);
    expect(screen.getByText("Bu alan için yetkin yok.")).toBeTruthy();
    expect(screen.queryByLabelText("Davet performansları")).toBeNull();
  });
});
