import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const styles = readFileSync(path.resolve(import.meta.dirname, "../admin.css"), "utf8");

describe("admin kullanıcı listesi responsive stilleri", () => {
  it("geniş kullanıcı verisini yatay kaydırılabilir tabloda korur", () => {
    expect(styles).toContain(".admin-users-table { overflow-x: auto;");
    expect(styles).toContain("min-width: 890px");
    expect(styles).toContain("@media (max-width: 600px) { .admin-users-dashboard");
    expect(styles).toContain(".admin-users-table { -webkit-overflow-scrolling: touch;");
  });
});
