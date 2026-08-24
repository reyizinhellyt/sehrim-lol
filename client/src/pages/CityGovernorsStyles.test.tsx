import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");

describe("Şehrin Valileri canlı durum animasyonu", () => {
  it("hareket azaltma tercihi olmayan kullanıcılar için yalnızca opaklık ve dönüşümle nabız animasyonu tanımlar", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: no-preference) { .city-governors-status { animation: city-governors-live-pulse 1.8s");
    expect(styles).toContain("@keyframes city-governors-live-pulse");
    expect(styles).toContain("opacity: .48; transform: scale(.76);");
  });
});
