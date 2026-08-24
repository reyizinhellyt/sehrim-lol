import { describe, expect, it } from "vitest";
import {
  getPreviousTurkeyDate,
  getTurkeyDate,
  rankCities,
  secondsUntilTurkeyMidnight,
} from "../shared/gameLogic";

describe("Türkiye günlük yarış mantığı", () => {
  it("Türkiye gününü UTC+3 sınırına göre belirler", () => {
    const beforeMidnight = new Date("2026-08-23T20:59:59.000Z");
    const afterMidnight = new Date("2026-08-23T21:00:00.000Z");
    const delayedJob = new Date("2026-08-24T17:00:00.000Z");
    expect(getTurkeyDate(beforeMidnight)).toBe("2026-08-23");
    expect(getTurkeyDate(afterMidnight)).toBe("2026-08-24");
    expect(getPreviousTurkeyDate(afterMidnight)).toBe("2026-08-23");
    expect(getPreviousTurkeyDate(delayedJob)).toBe("2026-08-23");
  });

  it("toplam puana göre 81 ili deterministik biçimde sıralar", () => {
    const ranking = rankCities({ "34": 12, "06": 8, "35": 5 });
    expect(ranking).toHaveLength(81);
    expect(ranking.slice(0, 3).map(city => city.cityCode)).toEqual(["34", "06", "35"]);
    expect(ranking[0]?.rank).toBe(1);
  });

  it("gün sonu geri sayımını pozitif saniye olarak verir", () => {
    const seconds = secondsUntilTurkeyMidnight(new Date("2026-08-23T20:59:00.000Z"));
    expect(seconds).toBe(60);
  });
});
