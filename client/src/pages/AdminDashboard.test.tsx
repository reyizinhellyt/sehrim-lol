import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts/ThemeContext";

const authState = vi.hoisted(() => ({
  user: {
    id: 1,
    openId: "admin-user",
    name: "Yönetici",
    email: "admin@example.com",
    loginMethod: "manus",
    role: "admin" as "admin" | "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
}));

const referralState = vi.hoisted(() => ({
  entries: [{ applicationId: 4, cityCode: "06", brandName: "Ankara Markası", status: "pending" as const, createdAt: new Date("2026-08-24T10:00:00.000Z"), qualifiedSupporters: 3 }],
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: authState.user, loading: false }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      overview: {
        useQuery: () => ({
          isLoading: false,
          isError: false,
          data: {
            recordDate: "2026-08-24",
            metrics: { dailyParticipations: 5, activeCities: 2, registeredUsers: 12, representedUsers: 8 },
            leaderboard: [{ cityCode: "06", cityName: "Ankara", rank: 1, totalPoints: 5, leader: null }],
            rollover: { configured: true, lastProcessedDate: "2026-08-23", updatedAt: new Date() },
            hallOfFame: [],
            recentParticipations: [],
          },
        }),
      },
      cityGovernorReferralPerformance: {
        useQuery: () => ({
          isLoading: false,
          isError: false,
          data: {
            totalLinks: referralState.entries.length,
            totalQualifiedSupporters: referralState.entries.reduce((total, entry) => total + entry.qualifiedSupporters, 0),
            entries: referralState.entries,
          },
        }),
      },
    },
  },
}));

import AdminDashboard from "./AdminDashboard";

afterEach(() => {
  cleanup();
  authState.user.role = "admin";
  referralState.entries = [{ applicationId: 4, cityCode: "06", brandName: "Ankara Markası", status: "pending", createdAt: new Date("2026-08-24T10:00:00.000Z"), qualifiedSupporters: 3 }];
});

describe("yönetici özeti", () => {
  it("davet performansını ana özetten ayrı tutarak günlük yarış metriklerini gösterir", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><AdminDashboard /></ThemeProvider>);

    expect(screen.getByText("Günlük yarış")).toBeTruthy();
    expect(screen.queryByLabelText("Davet performansları")).toBeNull();
  });

  it("normal kullanıcıya davet performansı panelini göstermez", () => {
    authState.user.role = "user";
    render(<ThemeProvider defaultTheme="dark" switchable><AdminDashboard /></ThemeProvider>);

    expect(screen.getByText("Bu alan için yetkin yok.")).toBeTruthy();
    expect(screen.queryByLabelText("Davet performansları")).toBeNull();
  });
});
