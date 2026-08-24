import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getAllTimeLeaderboard: vi.fn(),
}));

vi.mock("./db", () => ({
  getAllTimeLeaderboard: mocks.getAllTimeLeaderboard,
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("game.allTimeLeaderboard", () => {
  it("yalnız şehir sıralaması ve toplu oy verisini herkese açık döndürür", async () => {
    mocks.getAllTimeLeaderboard.mockResolvedValueOnce({
      totalVotes: 1459,
      leaderboard: [{
        cityCode: "34",
        cityName: "İstanbul",
        totalPoints: 219,
        rank: 1,
        percentage: 15,
        voterName: "Gizli Oy Veren",
      }],
    });
    const caller = appRouter.createCaller({ req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.game.allTimeLeaderboard()).resolves.toEqual({
      totalVotes: 1459,
      leaderboard: [{ cityCode: "34", cityName: "İstanbul", totalPoints: 219, rank: 1, percentage: 15 }],
    });
  });
});
