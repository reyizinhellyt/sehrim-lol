import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { getTurkeyDate } from "@shared/gameLogic";

const startLoginMock = vi.hoisted(() => vi.fn());
const toastInfoMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const nativeShareMock = vi.hoisted(() => vi.fn());
const clipboardWriteMock = vi.hoisted(() => vi.fn());
const anonymousVoteMutateMock = vi.hoisted(() => vi.fn());
const governorApplicationMutateMock = vi.hoisted(() => vi.fn());
const siteTrackVisitMutateMock = vi.hoisted(() => vi.fn());
const siteHeartbeatMutateMock = vi.hoisted(() => vi.fn());
const approvedSponsorsState = vi.hoisted(() => ({
  items: [] as Array<{ cityCode: string; brandName: string; website: string; message: string; logoUrl?: string }>,
}));
const formerSponsorsState = vi.hoisted(() => ({
  items: [] as Array<{ cityCode: string; brandName: string; website: string; message: string; changeType: "replaced" | "removed" | "revoked"; archivedAt: Date; logoUrl?: string }>,
}));
const referralProgressState = vi.hoisted(() => ({
  data: null as { referralCode: string; qualifiedSupporters: number } | null,
}));
const allTimeLeaderboardState = vi.hoisted(() => ({
  data: {
    totalVotes: 10,
    leaderboard: [
      { cityCode: "01", cityName: "Adana", totalPoints: 6, rank: 1, percentage: 60 },
      { cityCode: "06", cityName: "Ankara", totalPoints: 4, rank: 2, percentage: 40 },
    ],
  },
}));
const anonymousVoteStatusState = vi.hoisted(() => ({
  data: { recordDate: "2026-08-24", hasParticipated: false } as { recordDate: string; hasParticipated: boolean } | null,
}));
const authState = vi.hoisted(() => ({
  user: null as { email?: string | null; name?: string | null; role?: string } | null,
  isAuthenticated: false,
}));

vi.mock("@/const", () => ({ startLogin: startLoginMock }));
vi.mock("sonner", () => ({
  toast: { info: toastInfoMock, success: toastSuccessMock, error: toastErrorMock },
}));

vi.mock("@/_core/hooks/useAuth", () => ({
  useAuth: () => ({
    user: authState.user,
    loading: false,
    isAuthenticated: authState.isAuthenticated,
    logout: vi.fn(),
  }),
}));

vi.mock("@/lib/trpc", () => {
  const mutation = { mutate: vi.fn(), isPending: false };
  return {
    trpc: {
      useUtils: () => ({
        site: { pulse: { invalidate: vi.fn() } },
        game: {
          dashboard: { invalidate: vi.fn() },
          hallOfFame: { invalidate: vi.fn() },
          anonymousVoteStatus: { invalidate: vi.fn() },
        },
      }),
      game: {
        dashboard: { useQuery: () => ({ data: { leaderboard: [
          { cityCode: "01", cityName: "Adana", totalPoints: 6, rank: 1, leader: { userId: 1, name: "Gizli Oy Veren", points: 6 } },
          { cityCode: "06", cityName: "Ankara", totalPoints: 4, rank: 2, leader: { userId: 2, name: "Gizli Katılımcı", points: 4 } },
        ], profile: null, participation: null } }) },
        anonymousVoteStatus: { useQuery: () => ({ data: anonymousVoteStatusState.data, isLoading: false, isError: false }) },
        hallOfFame: { useQuery: () => ({ data: [] }) },
        allTimeLeaderboard: { useQuery: () => ({ data: allTimeLeaderboardState.data }) },
        selectCity: { useMutation: () => mutation },
        participate: { useMutation: () => ({ mutate: anonymousVoteMutateMock, isPending: false }) },
      },
      site: {
        pulse: { useQuery: () => ({ data: { onlineCount: 125, totalVisits: 41102, totalVotes: 7919 } }) },
        trackVisit: { useMutation: () => ({ mutate: siteTrackVisitMutateMock, isPending: false }) },
        heartbeat: { useMutation: () => ({ mutate: siteHeartbeatMutateMock, isPending: false }) },
      },
      cityGovernorApplications: {
        submit: { useMutation: () => ({ mutate: governorApplicationMutateMock, isPending: false }) },
        approvedSponsors: { useQuery: () => ({ data: approvedSponsorsState.items }) },
        formerSponsors: { useQuery: () => ({ data: formerSponsorsState.items }) },
        myReferralProgress: { useQuery: () => ({ data: referralProgressState.data }) },
      },
    },
  };
});

vi.mock("@/components/TurkeyMap", () => ({
  TurkeyMap: ({
    cities,
    onCitySelect,
    selectedCityCode,
  }: {
    cities: Array<{ cityCode: string; cityName: string }>;
    onCitySelect: (cityCode: string) => void;
    selectedCityCode?: string;
  }) => (
    <button type="button" aria-label="Ankara ayrıntısını aç" data-selected-city-code={selectedCityCode ?? ""} onClick={() => onCitySelect(cities[1]?.cityCode ?? "06")}>
      Ankara'yı haritada seç
    </button>
  ),
}));

import Home from "./Home";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  authState.user = null;
  authState.isAuthenticated = false;
  approvedSponsorsState.items = [];
  formerSponsorsState.items = [];
  referralProgressState.data = null;
  anonymousVoteStatusState.data = { recordDate: "2026-08-24", hasParticipated: false };
  window.localStorage.removeItem("sehrim-lol-anonymous-vote-date");
  siteTrackVisitMutateMock.mockReset();
  siteHeartbeatMutateMock.mockReset();
  nativeShareMock.mockReset();
  clipboardWriteMock.mockReset();
  anonymousVoteMutateMock.mockReset();
  Reflect.deleteProperty(navigator, "share");
  Reflect.deleteProperty(navigator, "clipboard");
  Reflect.deleteProperty(window.navigator, "share");
  Reflect.deleteProperty(window.navigator, "clipboard");
});

describe("mobil ana menü", () => {
  it("harita ilk açıldığında il seçimi olmadan kararlı renk düzenini korur", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    expect(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }).dataset.selectedCityCode).toBe("");
    const brand = screen.getByRole("link", { name: "sehrim.lol ana sayfa" });
    expect(within(brand).getByText("tr")).toBeTruthy();
    expect(brand.querySelector(".brand-wordmark")).toBeNull();
  });

  it("ana sayfada Günün Podyumu bölümünü göstermez", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    expect(screen.queryByText("GÜNÜN PODYUMU")).toBeNull();
    expect(document.querySelector(".podium-section")).toBeNull();
  });

  it("kişisel veri göstermeden canlı platform özetini sunar", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const pulse = screen.getByLabelText("Platform canlı durumu");
    expect(pulse.textContent).toContain("125ONLINE");
    expect(pulse.textContent).toContain("41.102ZİYARET");
    expect(pulse.textContent).toContain("7.919OY");
    expect(pulse.textContent).not.toContain("Gizli Oy Veren");
    expect(pulse.textContent).not.toContain("@");
  });

  it("oylama alanının altında IP başına günlük tek oy kuralını açıklar", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const note = screen.getByLabelText("Oylama kuralı");
    expect(note.textContent).toContain("aynı IP adresinden Türkiye gününde yalnız bir oy");
    expect(note.textContent).toContain("Ham IP adresi saklanmaz");
    expect(within(note).getByRole("link", { name: "Detaylar" }).getAttribute("href")).toBe("/hakkimizda#kurallar");
  });

  it("giriş yapmadan şehir seçip anonim oy gönderir", async () => {
    anonymousVoteMutateMock.mockImplementationOnce((input, callbacks: { onSuccess?: (result: { status: "recorded"; cityCode: string }) => void }) => callbacks.onSuccess?.({ status: "recorded", cityCode: input.cityCode }));
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0]);
    const voteDialog = screen.getByRole("dialog", { name: "Hangi şehre oy vereceksin?" });
    expect(within(voteDialog).getByText(/Hesap oluşturmadan oy verebilirsin/i)).toBeTruthy();
    await user.selectOptions(within(voteDialog).getByLabelText("Oy vereceğin şehir"), "01");
    await user.click(within(voteDialog).getByRole("button", { name: "Oy ver" }));

    expect(anonymousVoteMutateMock).toHaveBeenCalledWith({ cityCode: "01" }, expect.any(Object));
    expect(startLoginMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Adana adına 1 oy kaydedildi.", expect.objectContaining({ action: expect.objectContaining({ label: "Paylaş" }) }));
  });

  it("sayfa yenilendiğinde sunucunun günlük oy durumu ikinci oy eylemlerini kilitli tutar", async () => {
    anonymousVoteStatusState.data = { recordDate: "2026-08-24", hasParticipated: true };
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    expect(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0].hasAttribute("disabled")).toBe(true);
    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));
    expect(within(screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" })).getByRole("button", { name: "Ankara için oy ver" }).hasAttribute("disabled")).toBe(true);
    expect(anonymousVoteMutateMock).not.toHaveBeenCalled();
  });

  it("sayfa yenilendiğinde tarayıcıdaki aynı gün oy kaydı sunucu sorgusu gecikse bile oy düğmesini kilitli tutar", () => {
    window.localStorage.setItem("sehrim-lol-anonymous-vote-date", getTurkeyDate());
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    expect(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0].hasAttribute("disabled")).toBe(true);
  });

  it("günlük oy durumu henüz gelmeden oy düğmesini etkinleştirmez", () => {
    anonymousVoteStatusState.data = null;
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    expect(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0].hasAttribute("disabled")).toBe(true);
  });

  it("başarılı oy bildirimindeki paylaş eylemi şehir sonucunu yerel paylaşım menüsüne gönderir", async () => {
    anonymousVoteMutateMock.mockImplementationOnce((input, callbacks: { onSuccess?: (result: { status: "recorded"; cityCode: string }) => void }) => callbacks.onSuccess?.({ status: "recorded", cityCode: input.cityCode }));
    nativeShareMock.mockResolvedValueOnce(undefined);
    Object.defineProperty(window.navigator, "share", { configurable: true, value: nativeShareMock });
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0]);
    const voteDialog = screen.getByRole("dialog", { name: "Hangi şehre oy vereceksin?" });
    await user.selectOptions(within(voteDialog).getByLabelText("Oy vereceğin şehir"), "01");
    await user.click(within(voteDialog).getByRole("button", { name: "Oy ver" }));

    const notificationOptions = toastSuccessMock.mock.calls.find(([message]) => message === "Adana adına 1 oy kaydedildi.")?.[1] as { action: { label: string; onClick: () => Promise<void> } } | undefined;
    expect(notificationOptions?.action.label).toBe("Paylaş");
    await notificationOptions?.action.onClick();

    expect(nativeShareMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Adana için oy ver | sehrim.lol",
      text: "Adana için oyumu kullandım. Sen de şehrin için oy ver!",
      url: expect.stringContaining("il=01"),
    }));
  });

  it("yerel paylaşım desteklenmediğinde başarılı oy bildirimindeki paylaş eylemi bağlantıyı kopyalar", async () => {
    anonymousVoteMutateMock.mockImplementationOnce((input, callbacks: { onSuccess?: (result: { status: "recorded"; cityCode: string }) => void }) => callbacks.onSuccess?.({ status: "recorded", cityCode: input.cityCode }));
    Object.defineProperty(window.navigator, "share", { configurable: true, value: undefined });
    clipboardWriteMock.mockResolvedValueOnce(undefined);
    Object.defineProperty(window.navigator, "clipboard", { configurable: true, value: { writeText: clipboardWriteMock } });
    expect(window.navigator.share).toBeUndefined();
    expect(window.navigator.clipboard?.writeText).toBe(clipboardWriteMock);
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0]);
    const voteDialog = screen.getByRole("dialog", { name: "Hangi şehre oy vereceksin?" });
    await user.selectOptions(within(voteDialog).getByLabelText("Oy vereceğin şehir"), "06");
    await user.click(within(voteDialog).getByRole("button", { name: "Oy ver" }));

    const notificationOptions = toastSuccessMock.mock.calls.find(([message]) => message === "Ankara adına 1 oy kaydedildi.")?.[1] as { action: { onClick: () => Promise<void> } } | undefined;
    expect(notificationOptions).toBeDefined();
    await notificationOptions!.action.onClick();

    expect(toastErrorMock).not.toHaveBeenCalled();
    expect(toastSuccessMock).toHaveBeenCalledWith("Paylaşım metni ve bağlantısı kopyalandı.");
  });

  it("aynı internet bağlantısından ikinci oyda günlük sınır bilgisini gösterir", async () => {
    anonymousVoteMutateMock.mockImplementationOnce((_input, callbacks: { onSuccess?: (result: { status: "already-participated"; recordDate: string }) => void }) => callbacks.onSuccess?.({ status: "already-participated", recordDate: "2026-08-24" }));
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getAllByRole("button", { name: "Şehrine oy ver" })[0]);
    const voteDialog = screen.getByRole("dialog", { name: "Hangi şehre oy vereceksin?" });
    await user.click(within(voteDialog).getByRole("button", { name: "Oy ver" }));

    expect(toastInfoMock).toHaveBeenCalledWith(expect.stringMatching(/^Bugünkü oy hakkın bu internet bağlantısı için zaten kullanıldı\. Yeni tura \d{2}:\d{2}:\d{2} kaldı\.$/));
    expect(toastSuccessMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog", { name: "Hangi şehre oy vereceksin?" })).toBeNull();
  });

  it("Geçmiş Şampiyonlar alanında tam arşive yönlendiren bağlantıyı sunar", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);
    const link = screen.getByRole("link", { name: /Tüm Şampiyonlar/i });
    expect(link.getAttribute("href")).toBe("/sampiyonlar");
  });

  it("hamburger tetikleyicisini Enter ile açar ve ilk bağlantıya odaklanmayı sağlar", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const trigger = screen.getByRole("button", { name: "Menüyü aç" });
    trigger.focus();
    await user.keyboard("{Enter}");

    const navigation = screen.getByRole("navigation", { name: "Mobil ana menü" });
    expect(navigation).toBeTruthy();
    const firstLink = within(navigation).getByRole("link", { name: "Bugünün yarışı" });
    expect(firstLink.getAttribute("href")).toBe("#yaris");
    expect(firstLink.classList.contains("is-active")).toBe(true);
    expect(firstLink.getAttribute("aria-current")).toBe("location");

    await user.keyboard("{Tab}");
    expect(document.activeElement).toBe(firstLink);
  });

  it("tema düğmesine basıldığında sayfa kökündeki gündüz sınıfını etkinleştirir", async () => {
    const user = userEvent.setup();
    localStorage.clear();
    document.documentElement.className = "";
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Gündüz moduna geç" }));

    expect(document.documentElement.classList.contains("light")).toBe(true);
    expect(screen.getByRole("button", { name: "Karanlık moda geç" })).toBeTruthy();
  });

  it("onaylı sponsorların yalnız ilk altısını Şehrin Valileri önizlemesinde doğrudan web sitesi bağlantılarıyla gösterir", () => {
    approvedSponsorsState.items = [
      { cityCode: "01", brandName: "Adana Markası", website: "https://ornek.com/adana", message: "Adana kampanyası." },
      { cityCode: "02", brandName: "Adıyaman Markası", website: "https://ornek.com/adiyaman", message: "Adıyaman kampanyası." },
      { cityCode: "03", brandName: "Afyon Markası", website: "https://ornek.com/afyon", message: "Afyon kampanyası." },
      { cityCode: "04", brandName: "Ağrı Markası", website: "https://ornek.com/agri", message: "Ağrı kampanyası." },
      { cityCode: "05", brandName: "Amasya Markası", website: "https://ornek.com/amasya", message: "Amasya kampanyası." },
      { cityCode: "06", brandName: "Ankara Üniversite Topluluğu", website: "https://ornek.com/ankara", message: "Başkentteki öğrenciler ve şehir topluluğu için özel fırsatlar.", logoUrl: "/manus-storage/city-governor-applications/ankara-logo.png" },
      { cityCode: "07", brandName: "Antalya Markası", website: "https://ornek.com/antalya", message: "Antalya kampanyası." },
    ];
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const governors = screen.getByLabelText("Şehrin Valileri");
    expect(within(governors).getByText("Şehrin Valileri")).toBeTruthy();
    expect(within(governors).getByText("Ankara Valisi")).toBeTruthy();
    expect(within(governors).getByText("Ankara Üniversite Topluluğu")).toBeTruthy();
    expect(within(governors).getByRole("img", { name: "Ankara Üniversite Topluluğu logosu" }).getAttribute("src")).toBe("/manus-storage/city-governor-applications/ankara-logo.png");
    expect(within(governors).getByText("Başkentteki öğrenciler ve şehir topluluğu için özel fırsatlar.")).toBeTruthy();
    expect(governors.querySelectorAll(".city-governor-card")).toHaveLength(6);
    expect(within(governors).queryByText("Antalya Valisi")).toBeNull();
    expect(within(governors).getByRole("link", { name: /Tüm Vali Listesi/i }).getAttribute("href")).toBe("/valiler");
    expect(within(governors).getByRole("link", { name: /Tüm Vali Listesi/i }).classList.contains("city-governors-all-left")).toBe(true);
    const ankaraWebsite = within(governors).getByRole("link", { name: "Ankara Şehir Valisi Ankara Üniversite Topluluğu web sitesini yeni sekmede aç" });
    expect(ankaraWebsite.getAttribute("href")).toBe("https://ornek.com/ankara");
    expect(ankaraWebsite.getAttribute("target")).toBe("_blank");
    expect(ankaraWebsite.getAttribute("rel")).toContain("noopener");
    expect(within(governors).queryByRole("button", { name: /Devral/i })).toBeNull();
    expect(screen.queryByText("SEÇİLİ İL")).toBeNull();
    expect(governors.textContent).not.toContain("Gizli Oy Veren");
  });

  it("oy veren kişi verisi gelse bile herkese açık alanlarda kişi adını göstermez", () => {
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    expect(screen.queryByText("Gizli Oy Veren")).toBeNull();
    expect(screen.queryByText("Gizli Katılımcı")).toBeNull();
    expect(screen.queryByText("Günün lideri")).toBeNull();
    expect(screen.getByLabelText("Tüm zamanlar şehir sıralaması").textContent).not.toContain("Lider");
  });

  it("şehir sıralamasını bölge, şehir adı ve plaka koduyla filtreler", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const allTimeList = screen.getByLabelText("Tüm zamanlar şehir sıralaması");
    expect(screen.getByRole("heading", { name: /Şehir Sıralaması/i })).toBeTruthy();
    expect(allTimeList.textContent).toContain("Adana");
    await user.click(screen.getByRole("button", { name: "İç Anadolu" }));
    expect(allTimeList.textContent).toContain("Ankara");
    expect(allTimeList.textContent).not.toContain("Adana");

    await user.type(screen.getByPlaceholderText("Şehir ara…"), "06");
    expect(allTimeList.textContent).toContain("Ankara");
    expect(screen.getByText(/İç Anadolu Bölgesi: 1 şehir gösteriliyor/i)).toBeTruthy();
  });

  it("Tüm Bölgeler görünümünde gerçek tüm zamanlar oy oranı, aktif vali ve eski vali özetini gösterir", async () => {
    const user = userEvent.setup();
    approvedSponsorsState.items = [{ cityCode: "01", brandName: "Adana Markası", website: "https://ornek.com/adana", message: "Adana için aktif şehir valisi kampanyası." }];
    formerSponsorsState.items = [{ cityCode: "01", brandName: "Önceki Adana Markası", website: "https://ornek.com/eski-adana", message: "Önceki kampanya.", changeType: "replaced", archivedAt: new Date("2026-08-24T08:00:00.000Z") }];
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const allTimeList = screen.getByLabelText("Tüm zamanlar şehir sıralaması");
    expect(allTimeList.textContent).toContain("Adana");
    expect(allTimeList.textContent).toContain("%60");
    expect(allTimeList.textContent).toContain("6 oy");
    expect(within(allTimeList).getByRole("link", { name: "Adana Şehir Valisi Adana Markası web sitesini yeni sekmede aç" }).getAttribute("href")).toBe("https://ornek.com/adana");
    expect(within(allTimeList).getByRole("link", { name: /Önceki Adana Markası/ }).getAttribute("href")).toBe("https://ornek.com/eski-adana");
    expect(allTimeList.querySelector(".all-time-governor-body > svg")).toBeNull();
    await user.click(within(allTimeList).getByRole("button", { name: "Adana için Valiliği Devral" }));
    expect(startLoginMock).toHaveBeenCalledTimes(1);
    expect(allTimeList.textContent).not.toContain("Gizli Oy Veren");
  });

  it("oturumlu kullanıcı sıralama kartındaki Valiliği Devral eyleminden ilgili şehir başvuru popupını açar", async () => {
    authState.user = { email: "iletisim@ornek.com", name: "Başvuru Sahibi", role: "user" };
    authState.isAuthenticated = true;
    approvedSponsorsState.items = [{ cityCode: "01", brandName: "Adana Markası", website: "https://ornek.com/adana", message: "Adana için aktif şehir valisi kampanyası." }];
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Adana için Valiliği Devral" }));

    const applicationDialog = screen.getByRole("dialog", { name: "Şehir Valisi Başvurusu" });
    expect((within(applicationDialog).getByLabelText("Başvuru şehri") as HTMLInputElement).value).toBe("Adana");
  });

  it("valisi olmayan şehirde ücretsiz valilik kartını gösterir ve anonim kullanıcıyı girişe yönlendirir", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    const freeGovernorCard = screen.getByLabelText("Ankara Şehir Valiliği boşta");
    expect(within(freeGovernorCard).getByText("Bu şehrin valisi henüz yok.")).toBeTruthy();
    const action = within(freeGovernorCard).getByRole("button", { name: "Ankara için Bedavaya Vali Ol!" });
    expect(action.getAttribute("aria-haspopup")).toBe("dialog");
    await user.click(action);
    expect(startLoginMock).toHaveBeenCalledTimes(1);
  });

  it("oturumlu kullanıcı ücretsiz valilik kartından ilgili ücretsiz başvuru popupını açar", async () => {
    authState.user = { email: "iletisim@ornek.com", name: "Başvuru Sahibi", role: "user" };
    authState.isAuthenticated = true;
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara için Bedavaya Vali Ol!" }));

    const applicationDialog = screen.getByRole("dialog", { name: "Bedavaya Şehir Valisi Ol" });
    expect((within(applicationDialog).getByLabelText("Başvuru şehri") as HTMLInputElement).value).toBe("Ankara");
    expect(within(applicationDialog).getByRole("button", { name: "Ücretsiz başvuruyu gönder" })).toBeTruthy();
    expect(within(applicationDialog).getByText("ŞEHRİNİ BİRLİKTE BÜYÜT")).toBeTruthy();
  });

  it("haritada seçilen il için Şehir Valisi ayrıntı penceresini açar ve kişisel lider verisini gizler", async () => {
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));

    const dialog = screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" });
    const adPanel = within(dialog).getByLabelText("Şehir Valisi reklam alanı");
    expect(adPanel.tagName).toBe("SECTION");
    expect(within(dialog).getByLabelText("Ankara öne çıkan özelliği").textContent).toContain("Anıtkabir");
    expect(within(dialog).getByText("ŞEHİR VALİSİ")).toBeTruthy();
    expect(within(dialog).getByText("BU ALAN REKLAMA AÇIK")).toBeTruthy();
    expect(within(dialog).getByText("Ankara için görünür sponsor alanı")).toBeTruthy();
    expect(within(dialog).getByText("#2 sıra")).toBeTruthy();
    expect(within(dialog).getByRole("button", { name: "Ankara için oy ver" })).toBeTruthy();
    const adAction = within(dialog).getByRole("button", { name: "Bedavaya Vali Ol!" });
    expect(adAction.hasAttribute("disabled")).toBe(false);
    await user.click(adAction);
    expect(startLoginMock).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Gizli Oy Veren")).toBeNull();
    expect(screen.queryByText("Gizli Katılımcı")).toBeNull();

    await user.click(within(dialog).getByRole("button", { name: "Şehir ayrıntısını kapat" }));
    expect(screen.queryByRole("dialog", { name: "Ankara şehir ayrıntısı" })).toBeNull();
  });

  it("şehir ayrıntısındaki oy CTA’sı seçili şehir için doğrudan anonim oy gönderir", async () => {
    anonymousVoteMutateMock.mockImplementationOnce((input, callbacks: { onSuccess?: (result: { status: "recorded"; cityCode: string }) => void }) => callbacks.onSuccess?.({ status: "recorded", cityCode: input.cityCode }));
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));
    const dialog = screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" });
    await user.click(within(dialog).getByRole("button", { name: "Ankara için oy ver" }));

    expect(startLoginMock).not.toHaveBeenCalled();
    expect(anonymousVoteMutateMock).toHaveBeenCalledWith({ cityCode: "06" }, expect.any(Object));
    expect(toastSuccessMock).toHaveBeenCalledWith("Ankara adına 1 oy kaydedildi.", expect.objectContaining({ action: expect.objectContaining({ label: "Paylaş" }) }));
    expect(screen.queryByRole("dialog", { name: "Ankara şehir ayrıntısı" })).toBeNull();
    expect(screen.queryByRole("dialog", { name: "Hangi şehre oy vereceksin?" })).toBeNull();
  });

  it("onaylanan Şehir Valisini şehir penceresinde marka kartı olarak gösterir", async () => {
    approvedSponsorsState.items = [{
      cityCode: "06",
      brandName: "Ankara Üniversite Topluluğu",
      website: "https://ornek.com/ankara",
      message: "Başkentteki öğrenciler ve şehir topluluğu için özel fırsatlar.",
      logoUrl: "/manus-storage/city-governor-applications/ankara-logo.png",
    }];
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));

    const dialog = screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" });
    const sponsorPanel = within(dialog).getByLabelText("Ankara Şehir Valisi sponsor alanı");
    expect(within(sponsorPanel).getByText("AKTİF")).toBeTruthy();
    expect(within(sponsorPanel).getByText("Ankara Üniversite Topluluğu")).toBeTruthy();
    expect(within(sponsorPanel).getByRole("img", { name: "Ankara Üniversite Topluluğu logosu" }).getAttribute("src")).toBe("/manus-storage/city-governor-applications/ankara-logo.png");
    expect(within(sponsorPanel).getByText("Başkentteki öğrenciler ve şehir topluluğu için özel fırsatlar.")).toBeTruthy();
    const visitLink = within(sponsorPanel).getByRole("link", { name: "Markayı ziyaret et" });
    expect(visitLink.getAttribute("href")).toBe("https://ornek.com/ankara");
    expect(visitLink.getAttribute("target")).toBe("_blank");
    expect(within(sponsorPanel).getByRole("button", { name: "Valiliği Devral" })).toBeTruthy();
    expect(within(sponsorPanel).queryByText("BU ALAN REKLAMA AÇIK")).toBeNull();
  });

  it("sponsorun görsel logosu yoksa erişilebilir marka baş harfi yedeğini gösterir", async () => {
    approvedSponsorsState.items = [{
      cityCode: "06",
      brandName: "Ankara Topluluğu",
      website: "https://ornek.com/ankara",
      message: "Logo olmadan da okunur sponsor kartı.",
    }];
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));

    const dialog = screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" });
    expect(within(dialog).getByLabelText("Ankara Topluluğu için logo yedeği").textContent).toBe("A");
  });

  it("sponsor kartında başvuru logosunu kullanır", async () => {
    approvedSponsorsState.items = [{
      cityCode: "06",
      brandName: "Sehrim.lol",
      website: "https://sehrim.lol",
      message: "Şehrini ve Markanı Zirveye Taşı.",
      logoUrl: "/manus-storage/onceki-sponsor-logosi.png",
    }];
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));

    const sponsorPanel = screen.getByLabelText("Ankara Şehir Valisi sponsor alanı");
    expect(within(sponsorPanel).getByRole("img", { name: "Sehrim.lol logosu" }).getAttribute("src")).toBe("/manus-storage/onceki-sponsor-logosi.png");
  });

  it("giriş yapmış kullanıcı için ücretsiz Şehir Valisi başvuru formunu açar ve bilgileri gönderir", async () => {
   authState.user = { email: "iletisim@ornek.com", name: "Başvuru Sahibi", role: "user" };
   authState.isAuthenticated = true;
   nativeShareMock.mockResolvedValueOnce(undefined);
   Object.defineProperty(navigator, "share", { configurable: true, value: nativeShareMock });
   governorApplicationMutateMock.mockImplementationOnce((_input, callbacks: { onSuccess?: (result: { status: "pending"; referralCode: string }) => void }) => callbacks.onSuccess?.({ status: "pending", referralCode: "gv_abcdefghijklmnopqrstuvwx" }));
   const user = userEvent.setup();
   render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

   await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));
    await user.click(within(screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" })).getByRole("button", { name: "Bedavaya Vali Ol!" }));

    const applicationDialog = screen.getByRole("dialog", { name: "Bedavaya Şehir Valisi Ol" });
   expect((within(applicationDialog).getByLabelText("Başvuru şehri") as HTMLInputElement).value).toBe("Ankara");
   await user.type(within(applicationDialog).getByLabelText("Marka veya kurum adı"), "Örnek Marka");
   await user.clear(within(applicationDialog).getByLabelText("İletişim e-postası"));
   await user.type(within(applicationDialog).getByLabelText("İletişim e-postası"), "iletisim@ornek.com");
   await user.type(within(applicationDialog).getByLabelText("Web adresi"), "https://ornek.com");
   await user.type(within(applicationDialog).getByLabelText("Başvuru notu"), "Şehir topluluğu için görünür bir kampanya planlıyoruz.");
    await user.click(within(applicationDialog).getByRole("button", { name: "Ücretsiz başvuruyu gönder" }));

   expect(governorApplicationMutateMock).toHaveBeenCalledWith(
      {
        cityCode: "06",
        brandName: "Örnek Marka",
        contactEmail: "iletisim@ornek.com",
        website: "https://ornek.com",
        message: "Şehir topluluğu için görünür bir kampanya planlıyoruz.",
        attachment: undefined,
      },
      expect.any(Object)
    );
    expect(screen.getByRole("dialog", { name: "Bedavaya Şehir Valisi Ol" })).toBeTruthy();
    expect((within(applicationDialog).getByLabelText("Davet bağlantın") as HTMLInputElement).value).toContain("davet=gv_abcdefghijklmnopqrstuvwx");
    expect(within(applicationDialog).getByLabelText("0 başarılı davet")).toBeTruthy();
    expect(within(applicationDialog).getByRole("progressbar", { name: "Başarılı davet ilerlemesi" }).getAttribute("aria-valuemax")).toBe("5");
    await user.click(within(applicationDialog).getByRole("button", { name: "Telefonda paylaş" }));
    expect(nativeShareMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Ankara için destek ol", url: expect.stringContaining("davet=gv_abcdefghijklmnopqrstuvwx") }));
    expect(within(applicationDialog).getByRole("button", { name: "Davet bağlantısını kopyala" })).toBeTruthy();
    expect(toastSuccessMock).toHaveBeenCalledWith("Ankara için ücretsiz Şehir Valisi başvurun alındı. Davet bağlantın hazır.");
  });

  it("ücretsiz başvuru hatasında popup açık kalır ve kullanıcıya hata bildirimi gösterir", async () => {
    authState.user = { email: "iletisim@ornek.com", name: "Başvuru Sahibi", role: "user" };
    authState.isAuthenticated = true;
    const error = new Error("Başvuru şu anda kaydedilemedi.");
    governorApplicationMutateMock.mockImplementationOnce((_input, callbacks: { onError?: (error: Error) => void }) => callbacks.onError?.(error));
    const user = userEvent.setup();
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));
    await user.click(within(screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" })).getByRole("button", { name: "Bedavaya Vali Ol!" }));

    const applicationDialog = screen.getByRole("dialog", { name: "Bedavaya Şehir Valisi Ol" });
    await user.type(within(applicationDialog).getByLabelText("Marka veya kurum adı"), "Örnek Marka");
    await user.clear(within(applicationDialog).getByLabelText("İletişim e-postası"));
    await user.type(within(applicationDialog).getByLabelText("İletişim e-postası"), "iletisim@ornek.com");
    await user.type(within(applicationDialog).getByLabelText("Web adresi"), "https://ornek.com");
    await user.type(within(applicationDialog).getByLabelText("Başvuru notu"), "Şehir topluluğu için görünür bir kampanya planlıyoruz.");
    await user.click(within(applicationDialog).getByRole("button", { name: "Ücretsiz başvuruyu gönder" }));

    expect(screen.getByRole("dialog", { name: "Bedavaya Şehir Valisi Ol" })).toBeTruthy();
    expect(toastErrorMock).toHaveBeenCalledWith("Başvuru şu anda kaydedilemedi.");
  });

  it("başvuru formunda izin verilmeyen dosya türünü görünür biçimde reddeder", async () => {
    authState.user = { email: "iletisim@ornek.com", name: "Başvuru Sahibi", role: "user" };
    authState.isAuthenticated = true;
    const user = userEvent.setup({ applyAccept: false });
    render(<ThemeProvider defaultTheme="dark" switchable><Home /></ThemeProvider>);

    await user.click(screen.getByRole("button", { name: "Ankara ayrıntısını aç" }));
    await user.click(within(screen.getByRole("dialog", { name: "Ankara şehir ayrıntısı" })).getByRole("button", { name: "Bedavaya Vali Ol!" }));

    const applicationDialog = screen.getByRole("dialog", { name: "Bedavaya Şehir Valisi Ol" });
    const fileInput = within(applicationDialog).getByLabelText("Logo veya tanıtım dosyası yükle");
    await user.upload(fileInput, new File(["not allowed"], "tanitim.svg", { type: "image/svg+xml" }));

    expect(within(applicationDialog).getByRole("alert").textContent).toContain("PNG, JPG, WEBP veya PDF");
  });
});
