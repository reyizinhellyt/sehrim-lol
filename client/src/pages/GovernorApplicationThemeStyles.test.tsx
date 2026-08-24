import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(path.resolve(import.meta.dirname, "../index.css"), "utf8");

describe("Şehir Valisi başvuru popup tema stilleri", () => {
  it("açık temada popup ve formu ayrı, okunur yüzeylere taşır", () => {
    expect(styles).toContain(".light .governor-application-dialog");
    expect(styles).toContain("background: linear-gradient(150deg, #fffefa, #e6f0eb)");
    expect(styles).toContain(".light .governor-application-form input, .light .governor-application-form textarea");
    expect(styles).toContain("color: #1d3940");
  });

  it("açık temada odak ve gönderim eylemini görünür tutar", () => {
    expect(styles).toContain(".light .governor-application-form input:focus");
    expect(styles).toContain("box-shadow: 0 0 0 3px rgba(199, 122, 62, .16)");
    expect(styles).toContain(".light .governor-application-submit");
  });
});
