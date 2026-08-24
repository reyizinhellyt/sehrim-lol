import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  submitCityGovernorApplication: vi.fn(),
  getApprovedCityGovernorSponsors: vi.fn(),
  getFormerCityGovernorHistory: vi.fn(),
  getSitePulse: vi.fn(),
  trackSiteVisit: vi.fn(),
  heartbeatOnlineSession: vi.fn(),
  addAnonymousDailyParticipation: vi.fn(),
  getAnonymousDailyVoteStatus: vi.fn(),
  getMyCityGovernorReferralProgress: vi.fn(),
  getAdminCityGovernorReferralPerformance: vi.fn(),
  getMyCityGovernorApplications: vi.fn(),
  getCityGovernorApplicationAttachment: vi.fn(),
  getAdminCityGovernorApplications: vi.fn(),
  reviewCityGovernorApplication: vi.fn(),
  removeApprovedCityGovernorApplication: vi.fn(),
  reopenRemovedCityGovernorApplication: vi.fn(),
  storageGetSignedUrl: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    submitCityGovernorApplication: mocks.submitCityGovernorApplication,
    getApprovedCityGovernorSponsors: mocks.getApprovedCityGovernorSponsors,
    getFormerCityGovernorHistory: mocks.getFormerCityGovernorHistory,
    getSitePulse: mocks.getSitePulse,
    trackSiteVisit: mocks.trackSiteVisit,
    heartbeatOnlineSession: mocks.heartbeatOnlineSession,
    addAnonymousDailyParticipation: mocks.addAnonymousDailyParticipation,
    getAnonymousDailyVoteStatus: mocks.getAnonymousDailyVoteStatus,
    getMyCityGovernorReferralProgress: mocks.getMyCityGovernorReferralProgress,
    getAdminCityGovernorReferralPerformance: mocks.getAdminCityGovernorReferralPerformance,
    getMyCityGovernorApplications: mocks.getMyCityGovernorApplications,
    getCityGovernorApplicationAttachment: mocks.getCityGovernorApplicationAttachment,
    getAdminCityGovernorApplications: mocks.getAdminCityGovernorApplications,
    reviewCityGovernorApplication: mocks.reviewCityGovernorApplication,
    removeApprovedCityGovernorApplication: mocks.removeApprovedCityGovernorApplication,
    reopenRemovedCityGovernorApplication: mocks.reopenRemovedCityGovernorApplication,
  };
});

vi.mock("./storage", () => ({ storageGetSignedUrl: mocks.storageGetSignedUrl }));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createMemberContext(): TrpcContext {
  return {
    user: {
      id: 7,
      openId: "member-user",
      name: "Member User",
      email: "member@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {} as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return {
    ...createMemberContext(),
    user: { ...createMemberContext().user!, id: 1, openId: "admin-user", role: "admin" },
  };
}

const validApplication = {
  cityCode: "06",
  brandName: "Örnek Marka",
  contactEmail: "iletisim@ornek.com",
  website: "https://ornek.com",
  message: "Şehir topluluğu için görünür bir kampanya planlıyoruz.",
};

describe("cityGovernorApplications.submit", () => {
  it("oturumu olmayan ziyaretçilerin başvuru kaydı oluşturmasını engeller", async () => {
    const caller = appRouter.createCaller({ req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });
    await expect(caller.cityGovernorApplications.submit(validApplication)).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("giriş yapmış kullanıcının doğrulanmış başvurusunu kullanıcı kimliğiyle kaydeder", async () => {
    mocks.submitCityGovernorApplication.mockResolvedValueOnce({ status: "pending" });
    const caller = appRouter.createCaller(createMemberContext());

    await expect(caller.cityGovernorApplications.submit(validApplication)).resolves.toEqual({ status: "pending" });
    expect(mocks.submitCityGovernorApplication).toHaveBeenCalledWith(7, validApplication);
  });

  it("geçersiz başvuru alanlarını veritabanına göndermeden reddeder", async () => {
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.cityGovernorApplications.submit({ ...validApplication, website: "geçersiz-adres" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.submitCityGovernorApplication).toHaveBeenCalledTimes(1);
  });
});

describe("site canlı özet metrikleri", () => {
  it("anonim ziyaretçiye yalnızca toplam platform sayılarını sunar", async () => {
    const pulse = { onlineCount: 3, totalVisits: 24, totalVotes: 11 };
    mocks.getSitePulse.mockResolvedValueOnce(pulse);
    const caller = appRouter.createCaller({ req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.site.pulse()).resolves.toEqual(pulse);
    expect(mocks.getSitePulse).toHaveBeenCalledTimes(1);
  });

  it("anonim tarayıcının kimliksiz oturum anahtarıyla ziyaret ve heartbeat kaydetmesine izin verir", async () => {
    const pulse = { onlineCount: 1, totalVisits: 1, totalVotes: 0 };
    mocks.trackSiteVisit.mockResolvedValueOnce(pulse);
    mocks.heartbeatOnlineSession.mockResolvedValueOnce(pulse);
    const caller = appRouter.createCaller({ req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });
    const sessionId = "a0c470b0-1d48-4a6d-a31b-a024e3d630c2";

    await expect(caller.site.trackVisit({ sessionId })).resolves.toEqual(pulse);
    await expect(caller.site.heartbeat({ sessionId })).resolves.toEqual(pulse);
    expect(mocks.trackSiteVisit).toHaveBeenCalledWith(sessionId);
    expect(mocks.heartbeatOnlineSession).toHaveBeenCalledWith(sessionId);
  });
});

describe("davet bağlantılı şehir desteği", () => {
  it("anonim günlük oy durumunu IP parmak izini açığa çıkarmadan döndürür", async () => {
    mocks.getAnonymousDailyVoteStatus.mockResolvedValueOnce({ recordDate: "2026-08-24", hasParticipated: true });
    const caller = appRouter.createCaller({ req: { ip: "203.0.113.10" } as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.game.anonymousVoteStatus()).resolves.toEqual({ recordDate: "2026-08-24", hasParticipated: true });
    expect(mocks.getAnonymousDailyVoteStatus).toHaveBeenCalledWith(expect.stringMatching(/^[a-f0-9]{64}$/));
    expect(mocks.getAnonymousDailyVoteStatus.mock.calls[0]?.[0]).not.toBe("203.0.113.10");
  });

  it("oturumsuz ziyaretçinin güvenli davet kodunu IP parmak iziyle anonim oy işlemine iletir", async () => {
    const referralCode = "gv_abcdefghijklmnopqrstuvwx";
    mocks.addAnonymousDailyParticipation.mockResolvedValueOnce({ status: "recorded", recordDate: "2026-08-24", cityCode: "06", referralMatched: true });
    const caller = appRouter.createCaller({ req: { ip: "203.0.113.11" } as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.game.participate({ cityCode: "06", referralCode })).resolves.toMatchObject({ status: "recorded", referralMatched: true });
    expect(mocks.addAnonymousDailyParticipation).toHaveBeenCalledWith(expect.objectContaining({ cityCode: "06", referralCode, voterFingerprint: expect.stringMatching(/^[a-f0-9]{64}$/) }));
    expect(mocks.addAnonymousDailyParticipation.mock.calls[0]?.[0]?.voterFingerprint).not.toBe("203.0.113.11");
  });

  it("geçersiz davet kodunu günlük katılım işlemine iletmez", async () => {
    mocks.addAnonymousDailyParticipation.mockClear();
    const caller = appRouter.createCaller({ req: { ip: "203.0.113.12" } as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });
    await expect(caller.game.participate({ cityCode: "06", referralCode: "geçersiz" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(mocks.addAnonymousDailyParticipation).not.toHaveBeenCalled();
  });

  it("veritabanı sorgu ayrıntılarını anonim oy hatasında kullanıcıya sızdırmaz", async () => {
    mocks.addAnonymousDailyParticipation.mockClear();
    mocks.addAnonymousDailyParticipation.mockRejectedValueOnce(new Error("Failed query: insert into participations params: 6ff8631bd4dd"));
    const caller = appRouter.createCaller({ req: { ip: "203.0.113.13" } as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.game.participate({ cityCode: "06" })).rejects.toMatchObject({ code: "BAD_REQUEST", message: "Oyun şu anda kaydedilemedi. Lütfen tekrar dene." });
  });
});

describe("yönetici davet performansı", () => {
  it("yalnız yöneticiye şehir ve marka bazında toplu davet desteğini döndürür", async () => {
    const performance = {
      totalLinks: 1,
      totalQualifiedSupporters: 3,
      entries: [{ applicationId: 4, cityCode: "06", brandName: "Ankara Markası", status: "pending" as const, createdAt: new Date("2026-08-24T10:00:00.000Z"), qualifiedSupporters: 3 }],
    };
    mocks.getAdminCityGovernorReferralPerformance.mockResolvedValueOnce(performance);
    const adminCaller = appRouter.createCaller(createAdminContext());

    await expect(adminCaller.admin.cityGovernorReferralPerformance()).resolves.toEqual(performance);
    expect(mocks.getAdminCityGovernorReferralPerformance).toHaveBeenCalledTimes(1);

    const memberCaller = appRouter.createCaller(createMemberContext());
    await expect(memberCaller.admin.cityGovernorReferralPerformance()).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("cityGovernorApplications başvuru görünürlüğü ve dosya erişimi", () => {
  beforeEach(() => vi.clearAllMocks());

  it("kullanıcının yalnızca kendi başvuru listesini ister", async () => {
    mocks.getMyCityGovernorApplications.mockResolvedValueOnce([]);
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.cityGovernorApplications.mine()).resolves.toEqual([]);
    expect(mocks.getMyCityGovernorApplications).toHaveBeenCalledWith(7);
  });

  it("davet ilerlemesini yalnız oturumlu başvuru sahibi için şehir bazında döndürür", async () => {
    mocks.getMyCityGovernorReferralProgress.mockResolvedValueOnce({ referralCode: "gv_abcdefghijklmnopqrstuvwx", qualifiedSupporters: 3 });
    const caller = appRouter.createCaller(createMemberContext());

    await expect(caller.cityGovernorApplications.myReferralProgress({ cityCode: "06" })).resolves.toEqual({ referralCode: "gv_abcdefghijklmnopqrstuvwx", qualifiedSupporters: 3 });
    expect(mocks.getMyCityGovernorReferralProgress).toHaveBeenCalledWith(7, "06");
  });

  it("onaylı sponsorları herkese yalnızca şehir ve marka görünüm verisiyle sunar", async () => {
    const sponsor = {
      cityCode: "06",
      brandName: "Örnek Marka",
      website: "https://ornek.com",
      message: "Şehir topluluğu için onaylı sponsor içeriği.",
      logoUrl: "/manus-storage/city-governor-applications/public-logo.png",
      updatedAt: new Date("2026-08-23T12:00:00.000Z"),
    };
    mocks.getApprovedCityGovernorSponsors.mockResolvedValueOnce([sponsor]);
    const caller = appRouter.createCaller({ req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.cityGovernorApplications.approvedSponsors()).resolves.toEqual([{
      cityCode: "06",
      brandName: "Örnek Marka",
      website: "https://ornek.com",
      message: "Şehir topluluğu için onaylı sponsor içeriği.",
      logoUrl: "/manus-storage/city-governor-applications/public-logo.png",
    }]);
    expect(mocks.getApprovedCityGovernorSponsors).toHaveBeenCalledTimes(1);
  });

  it("eski valileri herkese yalnızca public şehir, marka, kampanya ve değişiklik verisiyle sunar", async () => {
    const formerGovernor = {
      cityCode: "06",
      brandName: "Önceki Marka",
      website: "https://ornek.com/eski",
      message: "Önceki şehir valiliği kampanyası.",
      changeType: "replaced" as const,
      archivedAt: new Date("2026-08-24T08:00:00.000Z"),
      logoUrl: "/manus-storage/city-governor-history/onceki-logo.png",
      contactEmail: "gizli@ornek.com",
      applicantName: "Gizli Başvuru Sahibi",
    };
    mocks.getFormerCityGovernorHistory.mockResolvedValueOnce([formerGovernor]);
    const caller = appRouter.createCaller({ req: {} as TrpcContext["req"], res: {} as TrpcContext["res"], user: null });

    await expect(caller.cityGovernorApplications.formerSponsors()).resolves.toEqual([{
      cityCode: "06",
      brandName: "Önceki Marka",
      website: "https://ornek.com/eski",
      message: "Önceki şehir valiliği kampanyası.",
      changeType: "replaced",
      archivedAt: new Date("2026-08-24T08:00:00.000Z"),
      logoUrl: "/manus-storage/city-governor-history/onceki-logo.png",
    }]);
    expect(mocks.getFormerCityGovernorHistory).toHaveBeenCalledTimes(1);
  });

  it("başka kullanıcıya ait ek dosyayı backend seviyesinde engeller", async () => {
    mocks.getCityGovernorApplicationAttachment.mockResolvedValueOnce({ id: 5, userId: 9, attachmentKey: "gizli/logo.png", attachmentName: "logo.png", attachmentContentType: "image/png" });
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.cityGovernorApplications.attachmentUrl({ applicationId: 5 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.storageGetSignedUrl).not.toHaveBeenCalled();
  });

  it("adminin başvuruyu kararı ve notuyla güncellemesine izin verir", async () => {
    mocks.reviewCityGovernorApplication.mockResolvedValueOnce({ status: "approved" });
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.reviewCityGovernorApplication({ applicationId: 4, status: "approved", decisionNote: "İçerik uygun bulundu." })).resolves.toEqual({ status: "approved" });
    expect(mocks.reviewCityGovernorApplication).toHaveBeenCalledWith(4, 1, "approved", "İçerik uygun bulundu.");
  });

  it("normal kullanıcının admin karar işlemini çağırmasını engeller", async () => {
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.admin.reviewCityGovernorApplication({ applicationId: 4, status: "rejected" })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("adminin onaylı sponsoru yayından kaldırıp yeniden incelemeye almasına izin verir", async () => {
    mocks.removeApprovedCityGovernorApplication.mockResolvedValueOnce({ status: "removed" });
    mocks.reopenRemovedCityGovernorApplication.mockResolvedValueOnce({ status: "pending" });
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.removeApprovedCityGovernorApplication({ applicationId: 4 })).resolves.toEqual({ status: "removed" });
    await expect(caller.admin.reopenRemovedCityGovernorApplication({ applicationId: 4 })).resolves.toEqual({ status: "pending" });
    expect(mocks.removeApprovedCityGovernorApplication).toHaveBeenCalledWith(4, 1);
    expect(mocks.reopenRemovedCityGovernorApplication).toHaveBeenCalledWith(4);
  });

  it("normal kullanıcının sponsor kaldırma veya yeniden inceleme işlemini çağırmasını engeller", async () => {
    const caller = appRouter.createCaller(createMemberContext());
    await expect(caller.admin.removeApprovedCityGovernorApplication({ applicationId: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
    await expect(caller.admin.reopenRemovedCityGovernorApplication({ applicationId: 4 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});
