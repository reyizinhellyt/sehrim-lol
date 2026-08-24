import { ThemeToggle } from "@/components/ThemeToggle";
import { CITY_BY_CODE } from "@shared/cities";
import { ArrowLeft, ArrowUpRight, Crown, Medal, Sparkles, Trophy } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

function cityName(code: string) {
  return CITY_BY_CODE[code as keyof typeof CITY_BY_CODE]?.name ?? code;
}

function rankTone(rank: number) {
  return rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : "plain";
}

export default function Champions() {
  const hallQuery = trpc.game.hallOfFame.useQuery();
  const entries = hallQuery.data ?? [];

  return <div className="site-shell champions-page">
    <div className="ambient-grid" />
    <header className="site-header champions-header">
      <Link href="/" className="brand" aria-label="sehrim.lol ana sayfa"><span className="brand-flag">tr</span><span>sehrim<span className="brand-dot">.</span>lol</span></Link>
      <div className="champions-header-actions"><ThemeToggle /><Link href="/" className="champions-back"><ArrowLeft size={15} /> Ana sayfa</Link></div>
    </header>
    <main className="champions-main">
      <section className="champions-hero">
        <div>
          <div className="eyebrow"><span /> TÜM ŞAMPİYONLAR</div>
          <h1>Şehirlerin<br /><em>şeref tablosu.</em></h1>
          <p>Günlük yarışların arşivlenen tüm şampiyon şehirlerini, sıraları ve puanlarıyla birlikte incele.</p>
        </div>
        <div className="champions-stat"><Trophy size={20} /><strong>{entries.length}</strong><span>ARŞİVLENEN KAYIT</span></div>
      </section>

      {hallQuery.isLoading ? <section className="champions-loading">Şampiyonlar arşivi hazırlanıyor…</section> : entries.length ? <section className="champions-archive" aria-label="Tüm Geçmiş Şampiyonlar">
        <header className="champion-archive-head"><span>Sıra</span><span>Şehir</span><span>Puan</span><span>Tarih</span></header>
        {entries.map((entry, index) => <article className="champion-archive-row" key={`${entry.recordDate}-${entry.cityCode}-${index}`}>
          <div className={`champion-rank ${rankTone(entry.cityRank)}`}><Medal size={15} /> #{entry.cityRank}</div>
          <div className="champion-city"><strong>{cityName(entry.cityCode)}</strong><span>{entry.cityCode} kodlu şehir</span></div>
          <b className="champion-score">{entry.totalPoints.toLocaleString("tr-TR")} <small>puan</small></b>
          <time>{entry.recordDate}</time>
        </article>)}
      </section> : <section className="champions-empty"><Sparkles size={26} /><h2>İlk şampiyonlar bekleniyor.</h2><p>Günün sonuçları arşivlendiğinde şehirler bu sayfada kalıcı olarak listelenecek.</p><Link href="/#yaris">Yarışı keşfet <ArrowUpRight size={15} /></Link></section>}
    </main>
  </div>;
}
