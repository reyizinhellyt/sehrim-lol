import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");

describe("mobil menü hareket stilleri", () => {
  it("menü giriş animasyonunu yalnızca hareket azaltma tercihi olmayan kullanıcılar için tanımlar", () => {
    expect(styles).toContain("@media (prefers-reduced-motion: no-preference) and (max-width: 760px)");
    expect(styles).toContain("animation: mobile-menu-reveal 220ms");
    expect(styles).toContain("animation: mobile-menu-item-in 180ms");
    expect(styles).toContain("@keyframes mobile-menu-reveal");
    expect(styles).toContain(".mobile-site-nav { display: grid; position: absolute;");
    expect(styles).toContain(".mobile-site-nav { position: static; z-index: auto; flex-basis: 100%;");
  });
});
