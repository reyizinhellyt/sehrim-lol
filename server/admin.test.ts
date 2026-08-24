import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAdminOverview: vi.fn(),
  getAdminUsers: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return { ...actual, getAdminOverview: mocks.getAdminOverview, getAdminUsers: mocks.getAdminUsers };
});

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMemberContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "member-user",
      name: "Member User",
      email: "member@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    ...createMemberContext(),
    user: {
      ...createMemberContext().user!,
      id: 1,
      openId: "admin-user",
      role: "admin",
    },
  };
}

describe("admin.overview", () => {
  it("normal kullanıcıların yönetim verilerine erişmesini engeller", async () => {
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.admin.overview()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("yönetici için özet metriklerini döndürür", async () => {
    const overview = {
      recordDate: "2026-08-23",
      metrics: { dailyParticipations: 12, registeredUsers: 80, representedUsers: 68, activeCities: 9 },
      leaderboard: [],
      recentParticipations: [],
      hallOfFame: [],
      rollover: { configured: true, lastProcessedDate: "2026-08-22", updatedAt: new Date() },
    };
    mocks.getAdminOverview.mockResolvedValueOnce(overview);

    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.overview()).resolves.toEqual(overview);
    expect(mocks.getAdminOverview).toHaveBeenCalledOnce();
  });
});

describe("admin.users", () => {
  it("normal kullanıcıların kayıtlı kullanıcı listesine erişmesini engeller", async () => {
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.admin.users()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("yönetici için kayıtlı kullanıcı listesini döndürür", async () => {
    const users = [{ id: 2, name: "Test Kullanıcısı", email: "test@example.com", loginMethod: "manus", role: "user", cityCode: "06", selectedAt: new Date(), createdAt: new Date(), lastSignedIn: new Date() }];
    mocks.getAdminUsers.mockResolvedValueOnce(users);

    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.users()).resolves.toEqual(users);
    expect(mocks.getAdminUsers).toHaveBeenCalledOnce();
  });
});
