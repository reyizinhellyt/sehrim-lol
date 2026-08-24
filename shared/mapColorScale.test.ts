import { describe, expect, it } from "vitest";
import { getVoteIntensity, getVoteIntensityColor } from "./mapColorScale";

describe("oy yoğunluğu renk ölçeği", () => {
  it("oy olmayan illeri nötr açık renkte tutar", () => {
    expect(getVoteIntensity(0, 100)).toBe(0);
    expect(getVoteIntensityColor(0, 100)).toBe("#dce4e8");
  });

  it("oy arttıkça rengin koyuluk yoğunluğunu artırır", () => {
    const lowIntensity = getVoteIntensity(1, 100);
    const mediumIntensity = getVoteIntensity(25, 100);
    const highIntensity = getVoteIntensity(100, 100);

    expect(lowIntensity).toBeGreaterThan(0);
    expect(mediumIntensity).toBeGreaterThan(lowIntensity);
    expect(highIntensity).toBe(1);
    expect(getVoteIntensityColor(1, 100)).not.toBe(getVoteIntensityColor(100, 100));
  });
});
