import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(path.resolve(import.meta.dirname, "MapTooltip.css"), "utf8");

describe("harita tooltip animasyon stilleri", () => {
  it("açılış ve kapanış animasyonlarını yalnızca hareket azaltma tercihi olmayan kullanıcılar için tanımlar", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: no-preference)");
    expect(styles).toContain("animation: map-tooltip-enter 170ms");
    expect(styles).toContain("animation: map-tooltip-exit 160ms");
    expect(styles).toContain("@keyframes map-tooltip-enter");
    expect(styles).toContain("@keyframes map-tooltip-exit");
    expect(styles).toContain(".map-vote-tooltip.is-static { animation: none !important");
    expect(styles).toContain(".map-vote-tooltip-stats");
    expect(styles).not.toContain(".map-vote-tooltip-leader");
  });
});
