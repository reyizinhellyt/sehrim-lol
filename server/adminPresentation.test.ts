import { describe, expect, it } from "vitest";
import { groupHallOfFameByDate } from "../shared/adminPresentation";

describe("Hall of Fame gün gruplaması", () => {
  it("farklı yarış günlerinin sonuçlarını ayrı arşiv gruplarında tutar", () => {
    const groups = groupHallOfFameByDate([
      { recordDate: "2026-08-23", cityCode: "06", totalPoints: 12, cityRank: 1, cityLeaderName: "Ada", cityLeaderPoints: 4 },
      { recordDate: "2026-08-23", cityCode: "34", totalPoints: 9, cityRank: 2, cityLeaderName: "Can", cityLeaderPoints: 3 },
      { recordDate: "2026-08-22", cityCode: "35", totalPoints: 15, cityRank: 1, cityLeaderName: "Ece", cityLeaderPoints: 5 },
    ]);

    expect(groups).toHaveLength(2);
    expect(groups[0]).toMatchObject({ recordDate: "2026-08-23" });
    expect(groups[0]?.results).toHaveLength(2);
    expect(groups[1]).toMatchObject({ recordDate: "2026-08-22" });
  });
});
