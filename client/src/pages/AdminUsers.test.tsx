import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const usersState = vi.hoisted(() => ({ empty: false }));
const exportMocks = vi.hoisted(() => ({ downloadAdminUsersWord: vi.fn() }));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({ user: authState.user, loading: false }),
}));

vi.mock("@/components/DashboardLayout", () => ({
  default: ({ children }: { children: React.ReactNode }) => <main>{children}</main>,
}));

vi.mock("@/lib/adminUsersWordExport", () => ({
  downloadAdminUsersWord: exportMocks.downloadAdminUsersWord,
}));

vi.mock("@/lib/trpc", () => ({
  trpc: {
    admin: {
      users: {
        useQuery: () => ({
          isLoading: false,
          isError: false,
          data: usersState.empty ? [] : [{
            id: 2,
            name: "Kayıtlı Kullanıcı",
            email: "uye@example.com",
            loginMethod: "manus",
            role: "user",
            cityCode: "06",
            selectedAt: new Date(),
            createdAt: new Date("2026-08-20T10:00:00Z"),
            lastSignedIn: new Date("2026-08-23T10:00:00Z"),
          }],
        }),
      },
    },
  },
}));

import AdminUsers from "./AdminUsers";

afterEach(() => {
  cleanup();
  authState.user.role = "admin";
  usersState.empty = false;
  exportMocks.downloadAdminUsersWord.mockReset();
});

describe("admin kullanıcı listesi", () => {
  it("admin için kayıtlı kullanıcı bilgilerini korumalı listede gösterir", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><AdminUsers /></ThemeProvider>);

    expect(screen.getByRole("table", { name: "Kayıtlı kullanıcı listesi" })).toBeTruthy();
    expect(screen.getByText("Kayıtlı Kullanıcı")).toBeTruthy();
    expect(screen.getByText("uye@example.com")).toBeTruthy();
    expect(screen.getByText("Ankara")).toBeTruthy();
    expect(screen.getByText("Kullanıcı", { selector: ".admin-role-badge" })).toBeTruthy();
  });

  it("normal kullanıcı için listeyi göstermez", () => {
    authState.user.role = "user";
    render(<ThemeProvider defaultTheme="dark" switchable><AdminUsers /></ThemeProvider>);

    expect(screen.getByText("Bu alan için yetkin yok.")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Kayıtlı kullanıcı listesi" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Word olarak indir" })).toBeNull();
  });

  it("liste boşsa kullanıcıya açık bir boş durum gösterir", () => {
    usersState.empty = true;
    render(<ThemeProvider defaultTheme="dark" switchable><AdminUsers /></ThemeProvider>);

    expect(screen.getByText("Henüz kayıtlı kullanıcı yok.")).toBeTruthy();
    expect(screen.queryByRole("table", { name: "Kayıtlı kullanıcı listesi" })).toBeNull();
    expect(screen.getByRole("button", { name: "Word olarak indir" }).hasAttribute("disabled")).toBe(true);
  });

  it("admin için kayıtları Word dosyası olarak dışa aktarır", async () => {
    const user = userEvent.setup();
    exportMocks.downloadAdminUsersWord.mockResolvedValueOnce(undefined);
    render(<ThemeProvider defaultTheme="dark" switchable><AdminUsers /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Word olarak indir" }));

    expect(exportMocks.downloadAdminUsersWord).toHaveBeenCalledWith(expect.arrayContaining([
      expect.objectContaining({ name: "Kayıtlı Kullanıcı", email: "uye@example.com", cityName: "Ankara" }),
    ]));
  });

  it("Word dışa aktarma başarısız olursa yöneticiye hata bildirimi gösterir", async () => {
    const user = userEvent.setup();
    exportMocks.downloadAdminUsersWord.mockRejectedValueOnce(new Error("Belge hatası"));
    render(<ThemeProvider defaultTheme="dark" switchable><AdminUsers /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Word olarak indir" }));

    expect((await screen.findByRole("alert")).textContent).toContain("Word belgesi oluşturulamadı. Lütfen tekrar deneyin.");
  });
});
