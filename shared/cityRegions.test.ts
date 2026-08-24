import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { CITY_REGION_BY_CODE, TURKEY_REGIONS, getCityRegion } from "./cityRegions";

describe("Türkiye şehir bölge eşlemesi", () => {
  it("81 ilin tamamını yedi coğrafi bölgeden biriyle eşler", () => {
    expect(Object.keys(CITY_REGION_BY_CODE)).toHaveLength(CITIES.length);
    expect(new Set(Object.values(CITY_REGION_BY_CODE))).toEqual(new Set(TURKEY_REGIONS.slice(1)));
    CITIES.forEach(city => expect(getCityRegion(city.code)).not.toBeNull());
  });

  it("bilinmeyen kod için bölge döndürmez", () => {
    expect(getCityRegion("99")).toBeNull();
  });
});
