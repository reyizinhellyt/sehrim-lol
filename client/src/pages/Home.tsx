import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { TurkeyMap, type MapCity } from "@/components/TurkeyMap";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CITIES } from "@shared/cities";
import { getCityHighlight } from "@shared/cityHighlights";
import { CITY_REGION_BY_CODE, TURKEY_REGIONS } from "@shared/cityRegions";
import { getTurkeyDate, secondsUntilTurkeyMidnight } from "@shared/gameLogic";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownRight,
  ArrowUpRight,
  Check,
  Clock3,
  Crown,
  FileText,
  FileUp,
  Flame,
  Heart,
  Landmark,
  LogOut,
  MapPinned,
  Menu,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

function formatCountdown(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;
  return [hours, minutes, remainder].map(value => String(value).padStart(2, "0")).join(":");
}

function dailyVoteLimitMessage(secondsUntilReset: number) {
  return `Bugünkü oy hakkın bu internet bağlantısı için zaten kullanıldı. Yeni tura ${formatCountdown(secondsUntilReset)} kaldı.`;
}

const ANONYMOUS_VOTE_LOCK_STORAGE_KEY = "sehrim-lol-anonymous-vote-date";

function getStoredAnonymousVoteDate() {
  try {
    return window.localStorage.getItem(ANONYMOUS_VOTE_LOCK_STORAGE_KEY);
  } catch {
    return null;
  }
}

function RankMark({ rank }: { rank: number }) {
  const tone = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "plain";
  return <span className={`rank-mark ${tone}`}>{String(rank).padStart(2, "0")}</span>;
}

function SponsorLogo({ brandName, logoUrl }: { brandName: string; logoUrl?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [logoUrl]);
  const initial = brandName.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "Ş";

  if (!logoUrl || imageFailed) {
    return <span className="city-sponsor-logo city-sponsor-logo-fallback" aria-label={`${brandName} için logo yedeği`}>{initial}</span>;
  }

  return <span className="city-sponsor-logo"><img src={logoUrl} alt={`${brandName} logosu`} onError={() => setImageFailed(true)} /></span>;
}

function formatMetric(value: number | undefined) {
  return typeof value === "number" ? value.toLocaleString("tr-TR") : "—";
}

function getOnlineSessionId() {
  const key = "sehrim-lol-online-session";
  const existing = window.sessionStorage.getItem(key);
  if (existing) return existing;
  const generated = window.crypto?.randomUUID?.() ?? `online-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.sessionStorage.setItem(key, generated);
  return generated;
}

function normalizeRankingSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

export default function Home() {
  const { user, loading: authLoading, isAuthenticated, logout } = useAuth();
  const utils = trpc.useUtils();
  const dashboardQuery = trpc.game.dashboard.useQuery(undefined, {
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const anonymousVoteStatusQuery = trpc.game.anonymousVoteStatus.useQuery(undefined, {
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const hallQuery = trpc.game.hallOfFame.useQuery();
  const allTimeLeaderboardQuery = trpc.game.allTimeLeaderboard.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const sitePulseQuery = trpc.site.pulse.useQuery(undefined, {
    refetchInterval: 20_000,
    refetchOnWindowFocus: true,
  });
  const participateMutation = trpc.game.participate.useMutation();
  const cityGovernorApplicationMutation = trpc.cityGovernorApplications.submit.useMutation();
  const trackVisitMutation = trpc.site.trackVisit.useMutation();
  const heartbeatMutation = trpc.site.heartbeat.useMutation();
  const approvedSponsorsQuery = trpc.cityGovernorApplications.approvedSponsors.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const formerSponsorsQuery = trpc.cityGovernorApplications.formerSponsors.useQuery(undefined, {
    refetchInterval: 30_000,
    refetchOnWindowFocus: true,
  });
  const [isCityDialogOpen, setCityDialogOpen] = useState(false);
  const [isCityPopoverOpen, setCityPopoverOpen] = useState(false);
  const [isGovernorApplicationOpen, setGovernorApplicationOpen] = useState(false);
  const [isComplimentaryGovernorApplication, setComplimentaryGovernorApplication] = useState(false);
  const [createdReferralCode, setCreatedReferralCode] = useState<string | null>(null);
  const [isReferralCopied, setReferralCopied] = useState(false);
  const [pendingCityCode, setPendingCityCode] = useState("06");
  const [selectedCityCode, setSelectedCityCode] = useState<string | undefined>();
  const [applicationBrandName, setApplicationBrandName] = useState("");
  const [applicationContactEmail, setApplicationContactEmail] = useState("");
  const [applicationWebsite, setApplicationWebsite] = useState("");
  const [applicationMessage, setApplicationMessage] = useState("");
  const [applicationAttachment, setApplicationAttachment] = useState<{
    fileName: string;
    contentType: "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
    dataBase64: string;
  } | null>(null);
  const [applicationAttachmentError, setApplicationAttachmentError] = useState<string | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("yaris");
  const [countdown, setCountdown] = useState(() => secondsUntilTurkeyMidnight());
  const [localVoteRecordDate, setLocalVoteRecordDate] = useState(getStoredAnonymousVoteDate);
  const [onlineSessionId] = useState(getOnlineSessionId);
  const [rankingSearch, setRankingSearch] = useState("");
  const [rankingRegion, setRankingRegion] = useState<(typeof TURKEY_REGIONS)[number]>("Tüm Bölgeler");
  const [incomingReferralCode] = useState(() => {
    const value = new URLSearchParams(window.location.search).get("davet");
    return value && /^gv_[A-Za-z0-9_-]{16,60}$/.test(value) ? value : undefined;
  });
  const governorReferralProgressQuery = trpc.cityGovernorApplications.myReferralProgress.useQuery(
    { cityCode: selectedCityCode ?? "06" },
    { enabled: isAuthenticated && isComplimentaryGovernorApplication, refetchInterval: 15_000 }
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => setCountdown(secondsUntilTurkeyMidnight()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const trackedKey = `sehrim-lol-visit-tracked-${onlineSessionId}`;
    const refreshPulse = () => void utils.site.pulse.invalidate();
    const heartbeat = () => heartbeatMutation.mutate({ sessionId: onlineSessionId }, { onSuccess: refreshPulse });

    if (window.sessionStorage.getItem(trackedKey)) heartbeat();
    else {
      trackVisitMutation.mutate(
        { sessionId: onlineSessionId },
        {
          onSuccess: () => {
            window.sessionStorage.setItem(trackedKey, "1");
            refreshPulse();
          },
        }
      );
    }
    const intervalId = window.setInterval(heartbeat, 25_000);
    return () => window.clearInterval(intervalId);
  }, [onlineSessionId]);

  useEffect(() => {
    const sectionIds = ["yaris", "siralama", "hall"];
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      entries => {
        const current = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (current?.target.id) setActiveSection(current.target.id);
      },
      { rootMargin: "-18% 0px -58% 0px", threshold: [0.08, 0.32, 0.65] }
    );
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const leaderboard = (dashboardQuery.data?.leaderboard ?? []) as MapCity[];
  const allTimeLeaderboard = allTimeLeaderboardQuery.data?.leaderboard ?? [];
  const rankingSource = allTimeLeaderboard;
  const filteredLeaderboard = useMemo(() => {
    const normalizedSearch = normalizeRankingSearch(rankingSearch.trim());
    return rankingSource.filter(city => {
      const cityRegion = CITY_REGION_BY_CODE[city.cityCode as keyof typeof CITY_REGION_BY_CODE];
      const matchesRegion = rankingRegion === "Tüm Bölgeler" || cityRegion === rankingRegion;
      const matchesSearch = !normalizedSearch || [city.cityName, city.cityCode].some(value => normalizeRankingSearch(value).includes(normalizedSearch));
      return matchesRegion && matchesSearch;
    });
  }, [rankingSource, rankingRegion, rankingSearch]);
  const selectedRegionLabel = rankingRegion === "Tüm Bölgeler" ? "Tüm Türkiye" : `${rankingRegion} Bölgesi`;
  const rankingTotalVotes = allTimeLeaderboardQuery.data?.totalVotes ?? 0;
  const selectedCity = useMemo(
    () => leaderboard.find(city => city.cityCode === selectedCityCode) ?? leaderboard[0],
    [leaderboard, selectedCityCode]
  );
  const isVoteStatusUnavailable = !anonymousVoteStatusQuery.data || anonymousVoteStatusQuery.isError;
  const isDailyVoteLocked = localVoteRecordDate === getTurkeyDate() || Boolean(anonymousVoteStatusQuery.data?.hasParticipated);
  const selectedCitySponsor = useMemo(
    () => approvedSponsorsQuery.data?.find(sponsor => sponsor.cityCode === selectedCity?.cityCode) ?? null,
    [approvedSponsorsQuery.data, selectedCity?.cityCode]
  );
  const cityGovernors = useMemo(
    () => (approvedSponsorsQuery.data ?? [])
      .map(sponsor => ({
        ...sponsor,
        cityName: leaderboard.find(city => city.cityCode === sponsor.cityCode)?.cityName
          ?? CITIES.find(city => city.code === sponsor.cityCode)?.name
          ?? sponsor.cityCode,
      }))
      .sort((left, right) => left.cityName.localeCompare(right.cityName, "tr-TR")),
    [approvedSponsorsQuery.data, leaderboard]
  );
  const cityGovernorPreview = cityGovernors.slice(0, 6);
  const activeGovernorByCity = useMemo(
    () => new Map((approvedSponsorsQuery.data ?? []).map(sponsor => [sponsor.cityCode, sponsor])),
    [approvedSponsorsQuery.data]
  );
  const formerGovernorsByCity = useMemo(() => {
    const groups = new Map<string, NonNullable<typeof formerSponsorsQuery.data>>();
    (formerSponsorsQuery.data ?? []).forEach(sponsor => {
      const current = groups.get(sponsor.cityCode) ?? [];
      current.push(sponsor);
      groups.set(sponsor.cityCode, current);
    });
    return groups;
  }, [formerSponsorsQuery.data]);
  const mapSponsorBadges = useMemo(
    () => (approvedSponsorsQuery.data ?? []).flatMap(sponsor => sponsor.logoUrl ? [{
      cityCode: sponsor.cityCode,
      brandName: sponsor.brandName,
      logoUrl: sponsor.logoUrl,
    }] : []),
    [approvedSponsorsQuery.data]
  );

  const refreshGame = async () => {
    await Promise.all([utils.game.dashboard.invalidate(), utils.game.hallOfFame.invalidate()]);
  };

  const openCityDetails = useCallback((cityCode: string) => {
    setSelectedCityCode(cityCode);
    setCityPopoverOpen(true);
  }, []);

  useEffect(() => {
    const cityCode = new URLSearchParams(window.location.search).get("il");
    if (!cityCode || !CITIES.some(city => city.code === cityCode)) return;
    openCityDetails(cityCode);
  }, [openCityDetails]);

  const openParticipation = () => {
    if (anonymousVoteStatusQuery.isLoading || isVoteStatusUnavailable) {
      toast.info("Oy hakkın doğrulanıyor. Lütfen birkaç saniye sonra tekrar dene.");
      return;
    }
    if (isDailyVoteLocked) {
      toast.info(dailyVoteLimitMessage(secondsUntilTurkeyMidnight()));
      return;
    }
    if (selectedCity) setPendingCityCode(selectedCity.cityCode);
    setCityPopoverOpen(false);
    setCityDialogOpen(true);
  };

  const openGovernorApplication = () => {
    if (!selectedCity) return;
    openGovernorApplicationForCity(selectedCity.cityCode);
  };

  const openGovernorApplicationForCity = (cityCode: string, isComplimentary = false) => {
    setSelectedCityCode(cityCode);
    if (!isAuthenticated) return startLogin();
    setComplimentaryGovernorApplication(isComplimentary);
    setCreatedReferralCode(null);
    setReferralCopied(false);
    setApplicationBrandName("");
    setApplicationContactEmail(user?.email ?? "");
    setApplicationWebsite("");
    setApplicationMessage("");
    setApplicationAttachment(null);
    setApplicationAttachmentError(null);
    setCityPopoverOpen(false);
    setGovernorApplicationOpen(true);
  };

  const selectGovernorAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const allowed = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const;
    if (!allowed.includes(file.type as typeof allowed[number])) {
      setApplicationAttachment(null);
      setApplicationAttachmentError("PNG, JPG, WEBP veya PDF formatında bir dosya seçmelisin.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setApplicationAttachment(null);
      setApplicationAttachmentError("Dosya en fazla 3 MB olabilir.");
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => setApplicationAttachmentError("Dosya okunamadı. Lütfen tekrar dene.");
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result.split(",")[1] : null;
      if (!result) {
        setApplicationAttachmentError("Dosya okunamadı. Lütfen tekrar dene.");
        return;
      }
      setApplicationAttachment({ fileName: file.name, contentType: file.type as typeof allowed[number], dataBase64: result });
      setApplicationAttachmentError(null);
    };
    reader.readAsDataURL(file);
  };

  const submitGovernorApplication = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCity) return;
    cityGovernorApplicationMutation.mutate(
      {
        cityCode: selectedCity.cityCode,
        brandName: applicationBrandName,
        contactEmail: applicationContactEmail,
        website: applicationWebsite,
        message: applicationMessage,
        attachment: applicationAttachment ?? undefined,
      },
      {
        onSuccess: result => {
          if (isComplimentaryGovernorApplication) {
            setCreatedReferralCode(result.referralCode);
            toast.success(`${selectedCity.cityName} için ücretsiz Şehir Valisi başvurun alındı. Davet bağlantın hazır.`);
            return;
          }
          toast.success(`${selectedCity.cityName} için Şehir Valisi başvurun alındı.`);
          setGovernorApplicationOpen(false);
        },
        onError: error => toast.error(error.message),
      }
    );
  };

  const complimentaryReferralCode = createdReferralCode ?? governorReferralProgressQuery.data?.referralCode ?? null;
  const complimentaryReferralUrl = useMemo(() => {
    if (!complimentaryReferralCode || !selectedCity) return "";
    const url = new URL(window.location.href);
    url.searchParams.set("il", selectedCity.cityCode);
    url.searchParams.set("davet", complimentaryReferralCode);
    url.hash = "yaris";
    return url.toString();
  }, [complimentaryReferralCode, selectedCity]);
  const qualifiedReferralSupporters = governorReferralProgressQuery.data?.qualifiedSupporters ?? 0;
  const referralGoal = 5;
  const referralProgress = Math.min((qualifiedReferralSupporters / referralGoal) * 100, 100);
  const referralsRemaining = Math.max(referralGoal - qualifiedReferralSupporters, 0);

  const copyComplimentaryReferralUrl = async () => {
    if (!complimentaryReferralUrl) return;
    try {
      await navigator.clipboard.writeText(complimentaryReferralUrl);
      setReferralCopied(true);
      toast.success("Davet bağlantın kopyalandı.");
    } catch {
      toast.error("Bağlantı kopyalanamadı. Lütfen tekrar dene.");
    }
  };

  const shareComplimentaryReferralUrl = async () => {
    if (!complimentaryReferralUrl || !selectedCity || !navigator.share) return;
    try {
      await navigator.share({
        title: `${selectedCity.cityName} için destek ol`,
        text: `${selectedCity.cityName} için oy ver ve Şehir Valiliği davetine destek ol.`,
        url: complimentaryReferralUrl,
      });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Yerel paylaşım menüsü açılamadı. Bağlantıyı kopyalayarak paylaşabilirsin.");
    }
  };

  const shareVoteResult = async (cityCode: string) => {
    const city = CITIES.find(item => item.code === cityCode);
    if (!city) return;
    const url = new URL(window.location.href);
    url.searchParams.set("il", cityCode);
    url.hash = "yaris";
    const text = `${city.name} için oyumu kullandım. Sen de şehrin için oy ver!`;

    try {
      if (window.navigator.share) {
        await window.navigator.share({
          title: `${city.name} için oy ver | sehrim.lol`,
          text,
          url: url.toString(),
        });
        return;
      }
      if (!window.navigator.clipboard?.writeText) {
        toast.error("Bu tarayıcıda paylaşım bağlantısı hazırlanamadı.");
        return;
      }
      await window.navigator.clipboard.writeText(`${text}\n${url.toString()}`);
      toast.success("Paylaşım metni ve bağlantısı kopyalandı.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      toast.error("Paylaşım hazırlanamadı. Lütfen tekrar dene.");
    }
  };

  const rememberDailyVoteLock = (recordDate: string | undefined) => {
    if (!recordDate || !/^\d{4}-\d{2}-\d{2}$/.test(recordDate)) return;
    setLocalVoteRecordDate(recordDate);
    try {
      window.localStorage.setItem(ANONYMOUS_VOTE_LOCK_STORAGE_KEY, recordDate);
    } catch {
      // Tarayıcının yerel depolama politikası oy kaydını etkilemez; sunucu durumu yine geçerlidir.
    }
  };

  const saveCity = (cityCode = pendingCityCode) => {
    participateMutation.mutate(
      { cityCode, ...(incomingReferralCode ? { referralCode: incomingReferralCode } : {}) },
      {
        onSuccess: async result => {
          const name = CITIES.find(city => city.code === cityCode)?.name;
          setCityDialogOpen(false);
          setSelectedCityCode(cityCode);
          if (result.status === "already-participated") {
            rememberDailyVoteLock(result.recordDate);
            await utils.game.anonymousVoteStatus.invalidate();
            toast.info(dailyVoteLimitMessage(secondsUntilTurkeyMidnight()));
            return;
          }
          toast.success(`${name} adına 1 oy kaydedildi.`, {
            action: {
              label: "Paylaş",
              onClick: () => shareVoteResult(cityCode),
            },
          });
          rememberDailyVoteLock(result.recordDate);
          await Promise.all([refreshGame(), utils.game.anonymousVoteStatus.invalidate()]);
        },
        onError: error => toast.error(error.message),
      }
    );
  };

  const voteForSelectedCity = () => {
    if (!selectedCity || participateMutation.isPending || isDailyVoteLocked || anonymousVoteStatusQuery.isLoading || isVoteStatusUnavailable) return;
    setPendingCityCode(selectedCity.cityCode);
    setCityPopoverOpen(false);
    saveCity(selectedCity.cityCode);
  };

  return (
    <div className="site-shell">
      <div className="ambient-grid" aria-hidden="true" />
      <header className="site-header">
        <a className="brand" href="#top" aria-label="sehrim.lol ana sayfa">
          <span className="brand-flag">tr</span>
          <span>sehrim<span className="brand-dot">.</span>lol</span>
        </a>
        <nav className="site-nav" aria-label="Ana menü">
          <a className={activeSection === "yaris" ? "is-active" : undefined} href="#yaris">Bugünün yarışı</a>
          <a className={activeSection === "siralama" ? "is-active" : undefined} href="#siralama">Sıralama</a>
          <a className={activeSection === "hall" ? "is-active" : undefined} href="#hall">Şeref tablosu</a>
          <a href="/hakkimizda">Hakkımızda</a>
        </nav>
        <div className="header-actions">
          <ThemeToggle />
          {isAuthenticated ? (
            <>
              {user?.role === "admin" && <a className="admin-header-link" href="/admin">Yönetim</a>}
              <a className="admin-header-link" href="/basvurularim">Başvurularım</a>
              <span className="user-chip" aria-label="Giriş yapılmış hesap">
                <span className="user-initial">{user?.name?.slice(0, 1).toUpperCase() ?? "T"}</span>
                <span>Hesabım</span>
              </span>
              <button className="icon-button" aria-label="Oturumu kapat" onClick={() => logout()}>
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <Button className="header-login" onClick={startLogin} disabled={authLoading}>
              Kayıt ol / Giriş yap <ArrowDownRight size={16} />
            </Button>
          )}
          <button
            className="mobile-menu-trigger"
            type="button"
            aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-main-navigation"
            onClick={() => setMobileMenuOpen(open => !open)}
          >
            {isMobileMenuOpen ? <X size={19} /> : <Menu size={20} />}
          </button>
        </div>
        {isMobileMenuOpen && (
          <nav className="mobile-site-nav" id="mobile-main-navigation" aria-label="Mobil ana menü">
            <a className={activeSection === "yaris" ? "is-active" : undefined} aria-current={activeSection === "yaris" ? "location" : undefined} href="#yaris" onClick={() => setMobileMenuOpen(false)}>Bugünün yarışı</a>
            <a className={activeSection === "siralama" ? "is-active" : undefined} aria-current={activeSection === "siralama" ? "location" : undefined} href="#siralama" onClick={() => setMobileMenuOpen(false)}>Sıralama</a>
            <a className={activeSection === "hall" ? "is-active" : undefined} aria-current={activeSection === "hall" ? "location" : undefined} href="#hall" onClick={() => setMobileMenuOpen(false)}>Şeref tablosu</a>
            <a href="/hakkimizda" onClick={() => setMobileMenuOpen(false)}>Hakkımızda</a>
          </nav>
        )}
      </header>

      <main id="top">
        <section className="hero-section">
          <div className="hero-copy">
            <div className="eyebrow"><span /> TÜRKİYE GÜNLÜK ŞEHİR YARIŞI</div>
            <h1>Şehrinin nabzını <em>zirveye</em> taşı.</h1>
            <p>
              Her gün sıfırdan başlayan yarışta tek bir katılım bile ilinin kaderini değiştirir.
              Gün bitmeden temsil ettiğin şehre gücünü ver.
            </p>
            <div className="pulse-strip" aria-label="Platform canlı durumu">
              <div className="pulse-item"><i className="online-dot" aria-hidden="true" /><strong>{formatMetric(sitePulseQuery.data?.onlineCount)}</strong><span>ONLINE</span></div>
              <i className="pulse-divider" aria-hidden="true" />
              <div className="pulse-item"><strong>{formatMetric(sitePulseQuery.data?.totalVisits)}</strong><span>ZİYARET</span></div>
              <i className="pulse-divider" aria-hidden="true" />
              <div className="pulse-item"><strong>{formatMetric(sitePulseQuery.data?.totalVotes)}</strong><span>OY</span></div>
            </div>
              <div className="hero-cta-row">
                <Button className="primary-cta" onClick={openParticipation} disabled={participateMutation.isPending || isDailyVoteLocked || anonymousVoteStatusQuery.isLoading || isVoteStatusUnavailable}>
                  <Flame size={17} />
                  Şehrine oy ver
                </Button>
                <a className="text-cta" href="#yaris">Haritayı keşfet <ArrowDownRight size={16} /></a>
              </div>
              <aside className="vote-ip-note" aria-label="Oylama kuralı">
                <ShieldCheck size={16} aria-hidden="true" />
                <div><strong>Günlük tek oy kuralı</strong><p>Hesap gerekmez; aynı IP adresinden Türkiye gününde yalnız bir oy kaydedilir. Ham IP adresi saklanmaz.</p></div>
                <a href="/hakkimizda#kurallar">Detaylar</a>
              </aside>
              <div className="hero-stats" aria-label="Yarış bilgileri">
              <div><strong>81</strong><span>İl</span></div>
              <div><strong>1</strong><span>Günlük katılım</span></div>
              <div><strong>00:00</strong><span>Yeni tur</span></div>
            </div>
          </div>

          <aside className="countdown-card" aria-label="Gün sonu geri sayımı">
            <div className="countdown-topline"><Clock3 size={16} /> GÜNÜN FİNALİNE</div>
            <div className="countdown-time">{formatCountdown(countdown)}</div>
            <p>Türkiye saatine göre gece yarısında sonuçlar arşivlenir ve yeni yarış başlar.</p>
            <div className="countdown-rule"><span /> Her IP adresi Türkiye gününde yalnız bir kez oy verebilir.</div>
          </aside>
        </section>

        <section id="yaris" className="race-section">
          <div className="section-heading">
            <div>
              <div className="eyebrow"><span /> CANLI ŞEHİR TABLOSU</div>
              <h2>Haritada bir il seç,<br /><em>yarışın içini gör.</em></h2>
            </div>
            <div className="map-legend" aria-label="Harita renk açıklaması">
              <span><i className="legend-swatch intensity" /> Az oy <b>→</b> yoğun oy</span>
              <span><i className="legend-swatch pale" /> Henüz oy yok</span>
            </div>
          </div>

          <div className="race-layout">
            <div className="map-panel">
              <TurkeyMap cities={leaderboard} selectedCityCode={selectedCityCode} onCitySelect={openCityDetails} sponsorBadges={mapSponsorBadges} />
              <div className="map-footer-note"><MapPinned size={15} /> İllere dokunarak canlı ayrıntıları incele.</div>
            </div>

            <aside className="city-governors-panel" aria-label="Şehrin Valileri">
              <header className="city-governors-heading">
                <span className="city-governors-icon"><Crown size={19} /></span>
                <div><span>ONAYLI SPONSOR ALANLARI</span><h3>Şehrin Valileri</h3></div>
                <i className="city-governors-status" aria-label="Aktif" />
              </header>
              {approvedSponsorsQuery.isLoading ? (
                <div className="city-governors-empty">Şehir Valileri yükleniyor…</div>
              ) : cityGovernors.length ? (
                <>
                  <div className="city-governors-list">
                    {cityGovernorPreview.map(governor => (
                    <a className="city-governor-card" key={governor.cityCode} href={governor.website} target="_blank" rel="noopener noreferrer" aria-label={`${governor.cityName} Şehir Valisi ${governor.brandName} web sitesini yeni sekmede aç`}>
                      <div className="city-governor-card-topline">
                        <span className="city-governor-code">{governor.cityCode}</span>
                        <span className="city-governor-city-name">{governor.cityName} Valisi</span>
                        <span className="city-governor-active">AKTİF</span>
                      </div>
                      <div className="city-governor-identity">
                        <SponsorLogo brandName={governor.brandName} logoUrl={governor.logoUrl} />
                        <div><strong>{governor.brandName}</strong><p>{governor.message}</p></div>
                      </div>
                    </a>
                    ))}
                  </div>
                  <Link href="/valiler" className="city-governors-all city-governors-all-left">Tüm Vali Listesi <ArrowUpRight size={15} /></Link>
                </>
              ) : (
                <div className="city-governors-empty"><Crown size={20} /><strong>Henüz aktif Şehir Valisi yok.</strong><span>Onaylanan markalar bu alanda şehirleriyle birlikte görünür.</span></div>
              )}
            </aside>
          </div>
        </section>

        <section id="siralama" className="ranking-section">
          <div className="ranking-heading">
            <div className="city-ranking-title">
              <Trophy size={32} aria-hidden="true" />
              <div>
                <div className="eyebrow"><span /> CANLI YARIŞ</div>
                <h2>Şehir <em>Sıralaması</em></h2>
              </div>
            </div>
          </div>
          <div className="ranking-tools" aria-label="Şehir sıralaması araçları">
            <label className="ranking-search" htmlFor="ranking-city-search"><Search size={20} aria-hidden="true" /><input id="ranking-city-search" type="search" value={rankingSearch} onChange={event => setRankingSearch(event.target.value)} placeholder="Şehir ara…" /></label>
            <nav className="ranking-region-menu" aria-label="Bölgelere göre şehir sıralaması">
              {TURKEY_REGIONS.map(region => <button type="button" key={region} className={`ranking-region-filter ${rankingRegion === region ? "is-active" : ""}`} aria-pressed={rankingRegion === region} onClick={() => setRankingRegion(region)}>{region}</button>)}
            </nav>
            <p className="ranking-result-summary" aria-live="polite">{selectedRegionLabel}: {filteredLeaderboard.length} şehir gösteriliyor · {formatMetric(rankingTotalVotes)} tüm zamanlar oyu</p>
          </div>
          <div className="all-time-ranking-list" aria-label="Tüm zamanlar şehir sıralaması">
              {filteredLeaderboard.map(city => {
                const activeGovernor = activeGovernorByCity.get(city.cityCode);
                const formerGovernors = formerGovernorsByCity.get(city.cityCode) ?? [];
                const voteShare = "percentage" in city && typeof city.percentage === "number" ? city.percentage : 0;
                return <article className={`all-time-city-card rank-${Math.min(city.rank, 3)}`} key={city.cityCode}>
                  <button type="button" className="all-time-city-heading" onClick={() => openCityDetails(city.cityCode)} aria-label={`${city.cityName} şehir ayrıntısını aç`}>
                    <span className="all-time-city-code">{city.cityCode}</span>
                    <strong>{city.cityName}</strong>
                    <b>#{city.rank}</b>
                  </button>
                  <div className="all-time-vote-summary">
                    <span><strong>%{voteShare.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}</strong><i>/</i>{formatMetric(city.totalPoints)} oy</span>
                    <span className="all-time-vote-caption">Tüm zamanlar oy payı</span>
                  </div>
                  <div className="all-time-progress" aria-label={`${city.cityName} tüm zamanlar oy oranı yüzde ${voteShare.toLocaleString("tr-TR", { maximumFractionDigits: 1 })}`}><span style={{ width: `${Math.min(Math.max(voteShare, 0), 100)}%` }} /></div>
                  {activeGovernor ? (
                    <>
                      <a className="all-time-governor-card" href={activeGovernor.website} target="_blank" rel="noopener noreferrer" aria-label={`${city.cityName} Şehir Valisi ${activeGovernor.brandName} web sitesini yeni sekmede aç`}>
                        <span className="all-time-governor-label"><Crown size={15} /> {city.cityName} Şehir Valisi</span>
                        <span className="all-time-governor-body"><SponsorLogo brandName={activeGovernor.brandName} logoUrl={activeGovernor.logoUrl} /><span><strong>{activeGovernor.brandName}</strong><small>{activeGovernor.message}</small></span></span>
                      </a>
                      <button type="button" className="all-time-governor-takeover" onClick={() => openGovernorApplicationForCity(city.cityCode)} aria-label={`${city.cityName} için Valiliği Devral`}><ShieldCheck size={15} /> Valiliği Devral</button>
                    </>
                  ) : (
                    <section className="all-time-governor-open" aria-label={`${city.cityName} Şehir Valiliği boşta`}>
                      <div className="all-time-governor-open-heading"><span><Crown size={15} /> Şehir Valiliği</span><b>BOŞTA</b></div>
                      <p>Bu şehrin valisi henüz yok.</p>
                      <button type="button" className="all-time-governor-free-action" aria-haspopup="dialog" aria-label={`${city.cityName} için Bedavaya Vali Ol!`} onClick={() => openGovernorApplicationForCity(city.cityCode, true)}><Sparkles size={15} /> Bedavaya Vali Ol!</button>
                    </section>
                  )}
                  <div className="all-time-former-governors">
                    <span><Clock3 size={14} /> Eski Valiler {formerGovernors.length > 0 && `(${formerGovernors.length})`}</span>
                    {formerGovernors.length > 0 ? formerGovernors.slice(0, 2).map(governor => <a href={governor.website} target="_blank" rel="noopener noreferrer" key={`${governor.brandName}-${String(governor.archivedAt)}`}><b>{governor.brandName}</b><small>{new Date(governor.archivedAt).toLocaleDateString("tr-TR")}</small></a>) : <small>Henüz geçmiş vali kaydı yok.</small>}
                  </div>
                </article>;
              })}
              {!filteredLeaderboard.length && <div className="ranking-empty"><Search size={19} aria-hidden="true" /><span>Aramana uygun şehir bulunamadı.</span></div>}
          </div>
        </section>

        <section id="hall" className="hall-section">
          <div className="hall-copy">
            <div className="eyebrow"><span /> HALL OF FAME</div>
            <h2>Dünün şehirleri,<br /><em>yarının hikâyesi.</em></h2>
            <p>Her gece sonuçlar mühürlenir. İlk üçte kalan şehirler burada kalır.</p>
            <div className="hall-badge"><Crown size={18} /> Geçmiş şampiyonlar değişmez.</div>
          </div>
          <div className="hall-list">
            {hallQuery.data && hallQuery.data.length > 0 ? hallQuery.data.slice(0, 5).map(entry => (
              <div className="hall-row" key={`${entry.recordDate}-${entry.cityCode}`}>
                <RankMark rank={entry.cityRank} />
                <div><strong>{leaderboard.find(city => city.cityCode === entry.cityCode)?.cityName ?? entry.cityCode}</strong><span>{entry.totalPoints} toplam puan</span></div>
                <time>{entry.recordDate}</time>
              </div>
            )) : (
              <div className="hall-empty"><Sparkles size={22} /><strong>İlk sayfa bu gece yazılacak.</strong><span>Günün sonuçları arşivlendiğinde şampiyon şehirler burada görünecek.</span></div>
            )}
            <Link href="/sampiyonlar" className="hall-all-link">Tüm Şampiyonlar <ArrowUpRight size={16} /></Link>
          </div>
        </section>

        <section className="participate-banner">
          <div><Landmark size={25} /><span>Şehrinin sesi <strong>seninle</strong> büyür.</span></div>
          <Button onClick={openParticipation} disabled={participateMutation.isPending || isDailyVoteLocked || anonymousVoteStatusQuery.isLoading || isVoteStatusUnavailable}><UsersRound size={17} /> Şehrine oy ver</Button>
        </section>
      </main>

      <footer className="site-footer"><span>sehrim.lol <i>beta</i></span><span>Türkiye'nin günlük şehir yarışı</span><span>Sonuçlar her gece Türkiye saatine göre yenilenir.</span></footer>

      <Dialog open={isCityDialogOpen} onOpenChange={setCityDialogOpen}>
        <DialogContent className="city-dialog">
          <DialogHeader>
            <DialogTitle>Hangi şehre oy vereceksin?</DialogTitle>
            <DialogDescription>Hesap oluşturmadan oy verebilirsin. Aynı IP adresinden Türkiye gününde yalnız bir oy kaydedilir.</DialogDescription>
          </DialogHeader>
          <label className="city-select-label" htmlFor="city-select">Oy vereceğin şehir</label>
          <select id="city-select" value={pendingCityCode} onChange={event => setPendingCityCode(event.target.value)}>
            {CITIES.map(city => <option key={city.code} value={city.code}>{city.code} — {city.name}</option>)}
          </select>
          <Button className="dialog-submit" onClick={() => saveCity()} disabled={participateMutation.isPending || isDailyVoteLocked || anonymousVoteStatusQuery.isLoading || isVoteStatusUnavailable}>
            {participateMutation.isPending ? "Oyun kaydediliyor…" : "Oy ver"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isCityPopoverOpen} onOpenChange={setCityPopoverOpen}>
        <DialogContent className="city-popover-dialog" showCloseButton={false}>
          {selectedCity && (
            <>
              <button className="city-popover-close" type="button" aria-label="Şehir ayrıntısını kapat" onClick={() => setCityPopoverOpen(false)}>
                <X size={18} />
              </button>
              <div className="city-popover-heading">
                <RankMark rank={selectedCity.rank} />
                <DialogTitle>{selectedCity.cityName} şehir ayrıntısı</DialogTitle>
              </div>
              <DialogDescription className="city-popover-description">
                <MapPinned size={15} /> Türkiye sıralamasında #{selectedCity.rank}. sırada
              </DialogDescription>

              <div className="city-popover-score" aria-label={`${selectedCity.totalPoints} günlük puan`}>
                <Heart size={18} fill="currentColor" />
                <strong>{selectedCity.totalPoints}</strong>
                <span>günlük puan</span>
                <b>#{selectedCity.rank} sıra</b>
              </div>

              <aside className="city-popover-highlight" aria-label={`${selectedCity.cityName} öne çıkan özelliği`}>
                <Sparkles size={16} aria-hidden="true" />
                <div><span>ŞEHRİN İZİ</span><p>{getCityHighlight(selectedCity.cityCode)}</p></div>
              </aside>

              <Button className="city-popover-vote" onClick={voteForSelectedCity} disabled={participateMutation.isPending || isDailyVoteLocked || anonymousVoteStatusQuery.isLoading || isVoteStatusUnavailable}>
                <Heart size={16} fill="currentColor" />
                {selectedCity.cityName} için oy ver
              </Button>

              {selectedCitySponsor ? (
                <section className="city-governor-panel city-sponsor-panel" aria-label={`${selectedCity.cityName} Şehir Valisi sponsor alanı`}>
                  <div className="city-governor-label">
                    <span><Crown size={14} /> {selectedCity.cityName.toLocaleUpperCase("tr-TR")} ŞEHİR VALİSİ</span>
                    <b>AKTİF</b>
                  </div>
                  <div className="city-sponsor-identity">
                    <SponsorLogo brandName={selectedCitySponsor.brandName} logoUrl={selectedCitySponsor.logoUrl} />
                    <div className="city-sponsor-copy">
                      <strong>{selectedCitySponsor.brandName}</strong>
                      <p>{selectedCitySponsor.message}</p>
                    </div>
                  </div>
                  <a className="city-sponsor-visit" href={selectedCitySponsor.website} target="_blank" rel="noreferrer">
                    <Crown size={15} /> Markayı ziyaret et <ArrowUpRight size={15} />
                  </a>
                  <button className="city-sponsor-apply" type="button" aria-haspopup="dialog" onClick={openGovernorApplication}>
                    <ShieldCheck size={13} aria-hidden="true" /> Valiliği Devral
                  </button>
                  <small>Sponsor içeriği onaylıdır ve açıkça etiketlenir.</small>
                </section>
              ) : (
                <section className="city-governor-panel city-ad-panel" aria-label="Şehir Valisi reklam alanı">
                  <div className="city-governor-label">
                    <span><Crown size={14} /> ŞEHİR VALİSİ</span>
                    <b>REKLAM</b>
                  </div>
                  <div className="city-ad-copy">
                    <span>BU ALAN REKLAMA AÇIK</span>
                    <strong>{selectedCity.cityName} için görünür sponsor alanı</strong>
                    <p>Şehir topluluğuna ulaşmak için Valilik alanında yerini ayırt.</p>
                  </div>
                  <button className="city-ad-action city-ad-free-action" type="button" aria-haspopup="dialog" onClick={() => openGovernorApplicationForCity(selectedCity.cityCode, true)}>
                    <Sparkles size={15} /> Bedavaya Vali Ol!
                  </button>
                  <small>Reklam ve sponsor içerikleri açıkça etiketlenir.</small>
                </section>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isGovernorApplicationOpen} onOpenChange={setGovernorApplicationOpen}>
        <DialogContent className="governor-application-dialog">
          <DialogHeader>
            <DialogTitle>{isComplimentaryGovernorApplication ? "Bedavaya Şehir Valisi Ol" : "Şehir Valisi Başvurusu"}</DialogTitle>
            <DialogDescription>
              {selectedCity?.cityName ?? "Seçili şehir"} için {isComplimentaryGovernorApplication ? "ilk Şehir Valiliği başvurunu ücretsiz olarak" : "reklam/sponsor alanı başvurunu"} ilet. Başvurular ekip tarafından incelenir.
            </DialogDescription>
          </DialogHeader>
          {isComplimentaryGovernorApplication && <aside className="complimentary-governor-intro" aria-label="Ücretsiz valilik davet akışı">
            <div><Sparkles size={16} aria-hidden="true" /><span>ŞEHRİNİ BİRLİKTE BÜYÜT</span></div>
            <ol>
              <li>Kartta görünecek marka veya topluluk bilgini yaz.</li>
              <li>Başvurunu kaydedince sana özel davet bağlantını al.</li>
              <li>Bağlantından gelen yeni kişiler şehrin için ilk oyunu verdiğinde ilerlemeyi takip et.</li>
            </ol>
          </aside>}
          {createdReferralCode ? (
            <section className="complimentary-referral-ready" aria-live="polite">
              <div className="complimentary-referral-ready-heading"><ShieldCheck size={18} aria-hidden="true" /><div><span>DAVET BAĞLANTIN HAZIR</span><strong>{selectedCity?.cityName} için destek topla</strong></div></div>
              <p>Bağlantını paylaş; yeni bir kullanıcı bu bağlantıdan gelip şehrin için ilk oyunu verdiğinde nitelikli destek sayacın artar.</p>
              <div className={`complimentary-referral-progress ${qualifiedReferralSupporters >= referralGoal ? "is-complete" : ""}`} aria-label={`${qualifiedReferralSupporters} başarılı davet`}> 
                <div><span>Başarılı davet hedefin</span><strong><b>{qualifiedReferralSupporters}</b><i>/</i>{referralGoal}</strong></div>
                <div className="complimentary-referral-meter" role="progressbar" aria-label="Başarılı davet ilerlemesi" aria-valuemin={0} aria-valuemax={referralGoal} aria-valuenow={Math.min(qualifiedReferralSupporters, referralGoal)}><span><i style={{ width: `${referralProgress}%` }} /></span></div>
                <p>{referralsRemaining > 0 ? `${referralsRemaining} yeni destek daha getir; paylaşımın şehrine güç katsın.` : "İlk hedef tamamlandı. Şehrin için daha fazla destek toplamaya devam et."}</p>
              </div>
              <label>
                Davet bağlantın
                <input value={complimentaryReferralUrl} readOnly aria-readonly="true" />
              </label>
              <div className="complimentary-referral-actions">
                {typeof navigator.share === "function" && <Button type="button" className="complimentary-referral-share" onClick={shareComplimentaryReferralUrl}>
                  <Share2 size={16} /> Telefonda paylaş
                </Button>}
                <Button type="button" className="complimentary-referral-copy" onClick={copyComplimentaryReferralUrl}>
                  <UsersRound size={16} /> {isReferralCopied ? "Bağlantı kopyalandı" : "Davet bağlantısını kopyala"}
                </Button>
              </div>
              <small>Bu hedef otomatik onay sağlamaz; tüm Şehir Valisi başvuruları ekip incelemesinden geçer. Bireysel destekçi bilgileri gösterilmez.</small>
            </section>
          ) : <form className="governor-application-form" onSubmit={submitGovernorApplication}>
            <label>
              Başvuru şehri
              <input value={selectedCity?.cityName ?? ""} readOnly aria-readonly="true" />
            </label>
            <label>
              Marka veya kurum adı
              <input value={applicationBrandName} onChange={event => setApplicationBrandName(event.target.value)} minLength={2} maxLength={160} required autoComplete="organization" />
            </label>
            <label>
              İletişim e-postası
              <input type="email" value={applicationContactEmail} onChange={event => setApplicationContactEmail(event.target.value)} maxLength={320} required autoComplete="email" />
            </label>
            <label>
              Web adresi
              <input type="url" value={applicationWebsite} onChange={event => setApplicationWebsite(event.target.value)} maxLength={2048} required placeholder="https://ornek.com" autoComplete="url" />
            </label>
            <label>
              Başvuru notu
              <textarea value={applicationMessage} onChange={event => setApplicationMessage(event.target.value)} minLength={20} maxLength={2000} required placeholder="Kampanya, hedef kitle ve iletişim tercihini kısaca paylaş." />
            </label>
            <div className="governor-attachment-field">
              <div>
                <b>Logo veya tanıtım dosyası</b>
                <span>İsteğe bağlı · PNG, JPG, WEBP veya PDF · En fazla 3 MB</span>
              </div>
              <label className="governor-attachment-select">
                <input className="governor-attachment-input" aria-label="Logo veya tanıtım dosyası yükle" type="file" accept="image/png,image/jpeg,image/webp,application/pdf" onChange={selectGovernorAttachment} />
                <FileUp size={15} /> Dosya seç
              </label>
            </div>
            {applicationAttachment ? <div className="governor-attachment-selected"><FileText size={15} /><span>{applicationAttachment.fileName}</span><button type="button" onClick={() => setApplicationAttachment(null)} aria-label="Seçilen dosyayı kaldır">Kaldır</button></div> : null}
            {applicationAttachmentError ? <p className="governor-attachment-error" role="alert">{applicationAttachmentError}</p> : null}
            <p className="governor-application-note">Gönderimle birlikte başvurunun incelenmesini kabul etmiş olursun. Reklam içerikleri yayınlanmadan önce onaya tabidir.</p>
            <Button className="governor-application-submit" type="submit" disabled={cityGovernorApplicationMutation.isPending}>
              <Crown size={16} /> {cityGovernorApplicationMutation.isPending ? "Başvurun gönderiliyor…" : isComplimentaryGovernorApplication ? "Ücretsiz başvuruyu gönder" : "Başvuruyu gönder"}
            </Button>
          </form>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
