import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowDownRight, ArrowLeft, CheckCircle2, Crown, HandHeart, Landmark, MapPinned, Menu, ShieldCheck, Sparkles, UsersRound, X } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "wouter";

const features = [
  {
    index: "01",
    title: "İnteraktif canlı harita",
    text: "81 ilin güncel yarış ritmini haritada görür, şehirlere dokunarak puan ve sıra ayrıntılarını anında inceleyebilirsin.",
    icon: MapPinned,
  },
  {
    index: "02",
    title: "Ücretsiz ve hızlı oy",
    text: "Hesap oluşturmadan desteklemek istediğin şehri seçip oy verirsin. Her yeni Türkiye günü, yarışa taze bir başlangıç getirir.",
    icon: HandHeart,
  },
  {
    index: "03",
    title: "Şehrin Valisi alanı",
    text: "Markalar ve topluluklar, görünür Şehir Valisi alanı için başvurabilir; onaylı içerikler şehir bağlamında sergilenir.",
    icon: Crown,
  },
  {
    index: "04",
    title: "Adil ve şeffaf yarış",
    text: "Aynı IP adresinden Türkiye gününde tek oy kaydedilir. Ham IP adresi saklanmaz; bireysel oy veren bilgileri public alanlarda görünmez.",
    icon: ShieldCheck,
  },
];

const principles = [
  ["Hesapsız oy", "Şehrini seç, oyunu doğrudan ver."],
  ["Günlük sınır", "Aynı IP adresi için her Türkiye gününde bir oy."],
  ["Ortak Wi‑Fi notu", "Okul, iş yeri veya misafir ağlarında aynı bağlantı paylaşılır. Ağdan daha önce oy verildiyse yeni turu gece yarısında beklemen gerekir."],
  ["Başvuru güvencesi", "Şehir Valisi başvurularında hesapla giriş zorunlu."],
];

export default function About() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("amac");

  useEffect(() => {
    const sectionIds = ["amac", "nasil-calisir", "kurallar"];
    const sections = sectionIds.map(id => document.getElementById(id)).filter((section): section is HTMLElement => Boolean(section));
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(entries => {
      const current = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (current?.target.id) setActiveSection(current.target.id);
    }, { rootMargin: "-18% 0px -58% 0px", threshold: [0.08, 0.32, 0.65] });
    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  return <div className="about-page about-reference-page">
    <header className="site-header about-header">
      <Link className="brand" href="/" aria-label="sehrim.lol ana sayfa"><span className="brand-flag">tr</span><span>sehrim<span className="brand-dot">.</span>lol</span></Link>
      <nav className="site-nav" aria-label="Sayfa menüsü"><Link href="/">Sıralamaya dön</Link><a className={activeSection === "amac" ? "is-active" : undefined} href="#amac">Hakkında</a><a className={activeSection === "nasil-calisir" ? "is-active" : undefined} href="#nasil-calisir">Nasıl çalışır?</a><a className={activeSection === "kurallar" ? "is-active" : undefined} href="#kurallar">Kurallar</a></nav>
      <div className="header-actions"><ThemeToggle /><Link href="/#yaris" className="header-login">Oy ver <ArrowDownRight size={15} /></Link><button className="mobile-menu-trigger" type="button" aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"} aria-expanded={isMobileMenuOpen} aria-controls="mobile-about-navigation" onClick={() => setMobileMenuOpen(open => !open)}>{isMobileMenuOpen ? <X size={19} /> : <Menu size={20} />}</button></div>
      {isMobileMenuOpen && <nav className="mobile-site-nav" id="mobile-about-navigation" aria-label="Mobil sayfa menüsü"><Link href="/" onClick={() => setMobileMenuOpen(false)}>Sıralamaya dön</Link><a className={activeSection === "amac" ? "is-active" : undefined} aria-current={activeSection === "amac" ? "location" : undefined} href="#amac" onClick={() => setMobileMenuOpen(false)}>Hakkında</a><a className={activeSection === "nasil-calisir" ? "is-active" : undefined} aria-current={activeSection === "nasil-calisir" ? "location" : undefined} href="#nasil-calisir" onClick={() => setMobileMenuOpen(false)}>Nasıl çalışır?</a><a className={activeSection === "kurallar" ? "is-active" : undefined} aria-current={activeSection === "kurallar" ? "location" : undefined} href="#kurallar" onClick={() => setMobileMenuOpen(false)}>Kurallar</a></nav>}
    </header>

    <main className="about-main about-reference-main">
      <section className="about-reference-hero" id="amac">
        <div className="about-hero-copy"><Link href="/" className="about-back-link"><ArrowLeft size={15} /> Sıralamaya dön</Link><div className="eyebrow"><span /> HAKKINDA — SEHRİM.LOL</div><h1>81 şehrin sesi,<br /><em>aynı yarışta.</em></h1><p>sehrim.lol, Türkiye’nin 81 ilini her gün yeniden başlayan, ücretsiz ve katılım odaklı bir şehir yarışında bir araya getiren beta platformudur.</p></div>
        <aside className="about-hero-signal" aria-label="Platform ilkeleri"><Sparkles size={22} /><span>HER GÜN YENİ TUR</span><strong>Tek oy bile<br />şehrinin ritmini değiştirir.</strong><small>Sonuçlar gece Türkiye saatine göre arşivlenir.</small></aside>
      </section>

      <section className="about-feature-section" id="nasil-calisir" aria-labelledby="about-feature-title"><div className="about-section-intro"><div className="eyebrow"><span /> PLATFORM DENEYİMİ</div><h2 id="about-feature-title">Şehrinle bağ kurmanın<br /><em>en kısa yolu.</em></h2><p>Referansın sade anlatımını, şehir yarışının gerçek kuralları ve mevcut akışlarıyla birleştirdik.</p></div><div className="about-feature-grid">{features.map(({ index, title, text, icon: Icon }) => <article className="about-feature-card" key={index}><div className="about-feature-card-top"><span>{index}</span><Icon size={21} /></div><h3>{title}</h3><p>{text}</p></article>)}</div></section>

      <section className="about-principles" id="kurallar"><div className="about-principle-banner"><Landmark size={25} /><div><span>AÇIK KURALLAR</span><h2>Yarış, herkes için<br /><em>anlaşılır kalsın.</em></h2></div></div><div className="about-principle-list">{principles.map(([title, text], index) => <article key={title}><b>0{index + 1}</b><div><strong>{title}</strong><p>{text}</p></div></article>)}</div></section>

      <section className="about-project-note"><CheckCircle2 size={21} /><p>Şehir Valisi başvuruları yönetici onayından geçer; kişisel başvuru ve oy veren verileri herkese açık listelerde yer almaz.</p><Link href="/valiler">Şehir Valilerini incele <ArrowDownRight size={15} /></Link></section>

      <section className="about-bottom-cta"><div><Crown size={23} /><span>Hazırsan, şehrinin hikâyesine bugün bir puan ekle.</span></div><Link href="/#yaris" className="about-vote-button">Şehrine oy ver <ArrowDownRight size={16} /></Link></section>
    </main>
    <footer className="site-footer about-footer"><span>sehrim.lol <i>beta</i></span><span>Türkiye’nin günlük şehir yarışı</span><Link href="/">Sıralamaya dön</Link></footer>
  </div>;
}
