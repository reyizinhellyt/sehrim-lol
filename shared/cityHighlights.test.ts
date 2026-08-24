import { describe, expect, it } from "vitest";
import { CITIES } from "./cities";
import { CITY_HIGHLIGHTS, getCityHighlight } from "./cityHighlights";

describe("şehir öne çıkan özellikleri", () => {
  it("her il kodu için kısa bir öne çıkan özellik metni sunar", () => {
    expect(Object.keys(CITY_HIGHLIGHTS)).toHaveLength(CITIES.length);
    for (const city of CITIES) {
      expect(getCityHighlight(city.code).trim().length).toBeGreaterThan(12);
    }
  });

  it("bilinmeyen bir şehir kodunda güvenli genel metne döner", () => {
    expect(getCityHighlight("99")).toContain("Yerel kültürü");
  });
});
