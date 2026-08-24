import { ThemeToggle } from "@/components/ThemeToggle";
import { trpc } from "@/lib/trpc";
import { CITIES, CITY_BY_CODE } from "@shared/cities";
import { ArrowLeft, ArrowUpRight, Crown, History, MapPin, Search, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

type DirectoryMode = "active" | "history" | "cities";

type ListedGovernor = {
  cityCode: string;
  cityName: string;
  brandName: string;
  website: string;
  message: string;
  logoUrl?: string;
};

type FormerGovernor = ListedGovernor & {
  changeType: "replaced" | "removed" | "revoked";
  archivedAt: Date;
};

function normalizeForSearch(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

function GovernorLogo({ brandName, logoUrl }: { brandName: string; logoUrl?: string }) {
  const [imageFailed, setImageFailed] = useState(false);
  useEffect(() => setImageFailed(false), [logoUrl]);
  const initial = brandName.trim().slice(0, 1).toLocaleUpperCase("tr-TR") || "Ş";
  return logoUrl && !imageFailed
    ? <span className="governor-directory-logo"><img src={logoUrl} alt={`${brandName} logosu`} onError={() => setImageFailed(true)} /></span>
    : <span className="governor-directory-logo governor-directory-logo-fallback" aria-label={`${brandName} için logo yedeği`}>{initial}</span>;
}

function GovernorDirectoryCard({ governor }: { governor: ListedGovernor }) {
  return <article className="governor-directory-card">
    <a className="governor-directory-row" href={governor.website} target="_blank" rel="noopener noreferrer" aria-label={`${governor.cityName} Şehir Valisi ${governor.brandName} web sitesini yeni sekmede aç`}>
      <div className="governor-directory-city"><span>{governor.cityCode}</span><div><b>{governor.cityName} Valisi</b></div></div>
      <div className="governor-directory-brand"><GovernorLogo brandName={governor.brandName} logoUrl={governor.logoUrl} /><div><strong>{governor.brandName}</strong><p>{governor.message}</p></div></div>
    </a>
  </article>;
}

function CityDirectoryCard({ city, governor }: { city: { code: string; name: string }; governor?: ListedGovernor }) {
  const content = <>
    <div className="governor-directory-city"><span>{city.code}</span><div><b>{city.name}</b></div></div>
    <div className="governor-directory-brand">
      {governor ? <><GovernorLogo brandName={governor.brandName} logoUrl={governor.logoUrl} /><div><strong>{governor.brandName}</strong><p>{governor.message}</p></div></> : <><span className="governor-directory-logo governor-directory-logo-vacant"><MapPin size={18} aria-hidden="true" /></span><div><strong>Valilik alanı açık</strong><p>Bu şehir için onaylı bir şehir valisi bulunmuyor.</p></div></>}
    </div>
    <span className={`governor-city-status ${governor ? "is-active" : ""}`}>{governor ? "AKTİF" : "AÇIK"}</span>
  </>;

  return governor
    ? <article className="governor-directory-card"><a className="governor-city-directory-row" href={governor.website} target="_blank" rel="noopener noreferrer" aria-label={`${city.name} Şehir Valisi ${governor.brandName} web sitesini yeni sekmede aç`}>{content}</a></article>
    : <article className="governor-city-directory-row">{content}</article>;
}

const FORMER_GOVERNOR_CHANGE_COPY = {
  replaced: "Yeni valiyle değişti",
  removed: "Yayından kaldırıldı",
  revoked: "Onayı geri çekildi",
} as const;

function FormerGovernorCard({ governor }: { governor: FormerGovernor }) {
  const archivedLabel = new Intl.DateTimeFormat("tr-TR", { day: "2-digit", month: "short", year: "numeric" }).format(governor.archivedAt);
  return <article className="governor-history-card">
    <a href={governor.website} target="_blank" rel="noopener noreferrer" aria-label={`${governor.cityName} eski Şehir Valisi ${governor.brandName} web sitesini yeni sekmede aç`}>
      <div className="governor-history-topline"><span>{governor.cityCode}</span><b>{governor.cityName} Eski Valisi</b><small>{FORMER_GOVERNOR_CHANGE_COPY[governor.changeType]}</small></div>
      <div className="governor-history-body"><GovernorLogo brandName={governor.brandName} logoUrl={governor.logoUrl} /><div><strong>{governor.brandName}</strong><p>{governor.message}</p><time dateTime={governor.archivedAt.toISOString()}>{archivedLabel}</time></div></div>
    </a>
  </article>;
}

export default function Governors() {
  const governorsQuery = trpc.cityGovernorApplications.approvedSponsors.useQuery();
  const formerGovernorsQuery = trpc.cityGovernorApplications.formerSponsors.useQuery();
  const [directoryMode, setDirectoryMode] = useState<DirectoryMode>("active");
  const [searchTerm, setSearchTerm] = useState("");
  const governors = useMemo<ListedGovernor[]>(
    () => (governorsQuery.data ?? [])
      .map(governor => ({ ...governor, cityName: CITY_BY_CODE[governor.cityCode as keyof typeof CITY_BY_CODE]?.name ?? governor.cityCode }))
      .sort((left, right) => left.cityName.localeCompare(right.cityName, "tr-TR")),
    [governorsQuery.data]
  );
  const normalizedSearch = useMemo(() => normalizeForSearch(searchTerm.trim()), [searchTerm]);
  const filteredGovernors = useMemo(() => governors.filter(governor => {
    if (!normalizedSearch) return true;
    return [governor.cityCode, governor.cityName, governor.brandName, governor.message].some(value => normalizeForSearch(value).includes(normalizedSearch));
  }), [governors, normalizedSearch]);
  const cityDirectory = useMemo(() => CITIES.map(city => ({
    city,
    governor: governors.find(governor => governor.cityCode === city.code),
  })).filter(({ city, governor }) => {
    if (!normalizedSearch) return true;
    return [city.code, city.name, governor?.brandName ?? "", governor?.message ?? ""].some(value => normalizeForSearch(value).includes(normalizedSearch));
  }), [governors, normalizedSearch]);
  const formerGovernors = useMemo<FormerGovernor[]>(
    () => (formerGovernorsQuery.data ?? [])
      .map(governor => ({ ...governor, cityName: CITY_BY_CODE[governor.cityCode as keyof typeof CITY_BY_CODE]?.name ?? governor.cityCode }))
      .sort((left, right) => right.archivedAt.getTime() - left.archivedAt.getTime()),
    [formerGovernorsQuery.data]
  );
  const filteredFormerGovernors = useMemo(() => formerGovernors.filter(governor => {
    if (!normalizedSearch) return true;
    return [governor.cityCode, governor.cityName, governor.brandName, governor.message].some(value => normalizeForSearch(value).includes(normalizedSearch));
  }), [formerGovernors, normalizedSearch]);

  const filterOptions: Array<{ id: DirectoryMode; label: string }> = [
    { id: "active", label: "Aktif Valiler" },
    { id: "history", label: "Eski Valiler" },
    { id: "cities", label: "Tüm Şehirler" },
  ];
  const visibleCount = directoryMode === "active" ? filteredGovernors.length : directoryMode === "cities" ? cityDirectory.length : filteredFormerGovernors.length;

  return <div className="site-shell governors-page">
    <div className="ambient-grid" />
    <header className="site-header governors-header">
      <Link href="/" className="brand" aria-label="sehrim.lol ana sayfa"><span className="brand-flag">tr</span><span>sehrim<span className="brand-dot">.</span>lol</span></Link>
      <div className="governors-header-actions"><ThemeToggle /><Link href="/#yaris" className="governors-back"><ArrowLeft size={15} /> Ana sayfa</Link></div>
    </header>
    <main className="governors-main">
      <section className="governors-hero">
        <div>
          <div className="eyebrow"><span /> TÜM VALİLER</div>
          <h1>81 İlin<br /><em>Valileri.</em></h1>
          <p>Onaylı şehir valilerini, şehirleri, markaları ve kampanyalarıyla tek bir listede incele.</p>
        </div>
        <div className="governors-stat"><Crown size={20} /><strong>{governors.length}</strong><span>AKTİF ŞEHİR VALİSİ</span></div>
      </section>

      <section className="governors-tools" aria-label="Vali listesi araçları">
        <nav className="governor-quick-filters" aria-label="Hızlı vali listesi filtreleri">
          {filterOptions.map(option => <button key={option.id} type="button" className={`governor-quick-filter ${directoryMode === option.id ? "is-active" : ""}`} aria-pressed={directoryMode === option.id} onClick={() => setDirectoryMode(option.id)}>{option.label}</button>)}
        </nav>
        <label className="governor-search" htmlFor="governor-search-input"><Search size={17} aria-hidden="true" /><input id="governor-search-input" type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} placeholder="Şehir, vali veya plaka ara" /></label>
        <p className="governor-result-count" aria-live="polite">{visibleCount} {directoryMode === "cities" ? "şehir bulundu" : directoryMode === "history" ? "eski vali kaydı bulundu" : "aktif vali bulundu"}</p>
      </section>

      {governorsQuery.isLoading || (directoryMode === "history" && formerGovernorsQuery.isLoading) ? <section className="governors-loading">Şehir Valileri listesi hazırlanıyor…</section> : directoryMode === "history" ? filteredFormerGovernors.length ? <section className="governor-history-directory" aria-label="Eski Valiler">
        {filteredFormerGovernors.map(governor => <FormerGovernorCard governor={governor} key={`${governor.cityCode}-${governor.archivedAt.toISOString()}-${governor.brandName}`} />)}
      </section> : <section className="governor-history-empty"><History size={26} /><h2>{normalizedSearch ? "Aramana uygun eski vali bulunamadı." : "Henüz eski vali kaydı yok."}</h2><p>{normalizedSearch ? "Şehir, marka veya iki haneli plaka koduyla tekrar deneyebilirsin." : "Onaylı bir şehir valisi değiştiğinde, önceki kartı burada geçmiş olarak saklanır."}</p></section> : directoryMode === "active" ? filteredGovernors.length ? <section className="governors-directory" aria-label="Aktif Şehir Valileri">
        {filteredGovernors.map(governor => <GovernorDirectoryCard governor={governor} key={governor.cityCode} />)}
      </section> : normalizedSearch ? <section className="governor-filter-empty"><Search size={23} /><h2>Aramana uygun aktif vali bulunamadı.</h2><p>Şehir, marka veya iki haneli plaka koduyla tekrar deneyebilirsin.</p></section> : <section className="governors-empty"><Sparkles size={26} /><h2>İlk Şehir Valisi bekleniyor.</h2><p>Onaylanan marka başvuruları burada şehirleriyle birlikte görünür.</p><Link href="/#yaris">Haritayı keşfet <ArrowUpRight size={15} /></Link></section> : cityDirectory.length ? <section className="governors-directory governor-city-directory" aria-label="81 ilin valilik durumu">
        {cityDirectory.map(({ city, governor }) => <CityDirectoryCard city={city} governor={governor} key={city.code} />)}
      </section> : <section className="governor-filter-empty"><Search size={23} /><h2>Aramana uygun şehir bulunamadı.</h2><p>Şehir adını, şehir valisini veya iki haneli plaka kodunu kontrol ederek tekrar dene.</p></section>}
    </main>
  </div>;
}
