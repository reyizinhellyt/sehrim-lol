import { afterEach, describe, expect, it, vi } from "vitest";
import { ADMIN_USERS_WORD_HEADERS, downloadAdminUsersWord, getAdminUsersExportFilename, getAdminUsersWordRows, getAdminUsersWordSummary } from "./adminUsersWordExport";

describe("admin kullanıcı Word dışa aktarma verisi", () => {
  it("Word dosyası için tarihli .docx dosya adı ve kullanıcı satırlarını üretir", () => {
    expect(getAdminUsersExportFilename(new Date("2026-08-23T12:00:00Z"))).toBe("sehrim-lol-kayitli-kullanicilar-2026-08-23.docx");
    expect(ADMIN_USERS_WORD_HEADERS).toEqual(["Kullanıcı", "E-posta", "Rol", "Temsil ili", "Giriş yöntemi", "Kayıt", "Son oturum"]);

    const [row] = getAdminUsersWordRows([{
      name: "Örnek Kullanıcı",
      email: null,
      role: "admin",
      cityName: "Ankara",
      loginMethod: "google",
      createdAt: new Date("2026-08-20T10:00:00Z"),
      lastSignedIn: new Date("2026-08-23T10:00:00Z"),
    }]);

    expect(row).toEqual(expect.arrayContaining(["Örnek Kullanıcı", "E-posta bilgisi yok", "Yönetici", "Ankara", "google"]));
    expect(getAdminUsersWordSummary([{
      name: "Örnek Kullanıcı", email: null, role: "admin", cityName: "Ankara", loginMethod: "google", createdAt: new Date("2026-08-20T10:00:00Z"), lastSignedIn: new Date("2026-08-23T10:00:00Z"),
    }], new Date("2026-08-23T12:00:00Z"))).toContain("Oluşturulma:");
  });

  it("gerçek .docx blob oluşturur ve tarayıcı indirme akışını başlatır", async () => {
    const createObjectURL = vi.fn((_blob: Blob) => "blob:admin-users");
    const revokeObjectURL = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => undefined);
    Object.defineProperty(URL, "createObjectURL", { configurable: true, value: createObjectURL });
    Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: revokeObjectURL });

    const generatedAt = new Date("2026-08-23T12:00:00Z");
    await downloadAdminUsersWord([{
      name: "Örnek Kullanıcı",
      email: "ornek@example.com",
      role: "user",
      cityName: "Ankara",
      loginMethod: "google",
      createdAt: new Date("2026-08-20T10:00:00Z"),
      lastSignedIn: new Date("2026-08-23T10:00:00Z"),
    }], generatedAt);

    const blob = createObjectURL.mock.calls[0]?.[0] as Blob | undefined;
    expect(blob).toBeInstanceOf(Blob);
    expect(blob?.size).toBeGreaterThan(0);
    expect(anchorClick).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith("blob:admin-users");
  });
});

afterEach(() => vi.restoreAllMocks());
