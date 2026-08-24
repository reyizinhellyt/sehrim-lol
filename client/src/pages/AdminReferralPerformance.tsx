import DashboardLayout from "@/components/DashboardLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { CITY_BY_CODE } from "@shared/cities";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BarChart3, CircleAlert, Loader2, Share2, ShieldAlert, Sparkles } from "lucide-react";
import React from "react";
import { Link } from "wouter";
import "@/admin.css";

function cityName(cityCode: string) {
  return CITY_BY_CODE[cityCode as keyof typeof CITY_BY_CODE]?.name ?? cityCode;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

function statusLabel(status: "pending" | "approved" | "rejected" | "removed") {
  if (status === "pending") return "İnceleniyor";
  if (status === "approved") return "Onaylandı";
  if (status === "removed") return "Kaldırıldı";
  return "Reddedildi";
}

export default function AdminReferralPerformance() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const performance = trpc.admin.cityGovernorReferralPerformance.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });

  if (authLoading) return <div className="admin-access-state"><Loader2 className="animate-spin" /> Yönetici oturumu kontrol ediliyor…</div>;
  if (!user) return <div className="admin-access-state"><ShieldAlert size={28} /><h1>Yönetim alanı korumalıdır.</h1><p>Davet performanslarını görmek için yetkili bir hesapla giriş yapmalısın.</p><Link href="/">Ana sayfaya dön</Link></div>;
  if (!isAdmin) return <div className="admin-access-state"><ShieldAlert size={28} /><h1>Bu alan için yetkin yok.</h1><p>Davet performansları yalnız yönetici rolüne atanmış hesaplar tarafından görüntülenebilir.</p><Link href="/">Ana sayfaya dön</Link></div>;

  return <DashboardLayout><div className="admin-dashboard admin-referral-dashboard">
    <header className="admin-page-header"><div><div className="admin-eyebrow"><Share2 size={14} /> DAVET ANALİTİĞİ</div><h1>Paylaşımın <em>etkisini</em> izle.</h1><p>Ücretsiz Şehir Valiliği davetlerinin nitelikli destek dönüşümünü tek ekranda takip et.</p></div><div className="admin-header-actions"><span className="admin-live-status"><span /> Canlı veri</span><ThemeToggle /><Link href="/" className="admin-site-link">Siteyi görüntüle <ArrowUpRight size={15} /></Link></div></header>
    {performance.isLoading ? <div className="admin-loading-panel"><Loader2 className="animate-spin" /> Davet performansları yükleniyor…</div> : performance.isError || !performance.data ? <div className="admin-error-panel"><CircleAlert size={22} /><div><strong>Davet performansları yüklenemedi.</strong><span>{performance.error?.message ?? "Lütfen sayfayı yeniden dene."}</span></div></div> : <section className="admin-panel admin-referral-performance-panel" aria-label="Davet performansları">
      <div className="admin-panel-title"><div><span>ÜCRETSİZ VALİLİK DAVETLERİ</span><h2>Başarılı destek dönüşümleri</h2></div><BarChart3 size={20} /></div>
      <div className="admin-referral-summary"><div><span>Aktif davet bağlantısı</span><strong>{performance.data.totalLinks.toLocaleString("tr-TR")}</strong></div><div><span>Nitelikli yeni destek</span><strong>{performance.data.totalQualifiedSupporters.toLocaleString("tr-TR")}</strong></div><small>Her yeni kullanıcı yalnız bir kez; yalnız ilgili şehir için ilk oyunda sayılır.</small></div>
      {performance.data.entries.length ? <div className="admin-referral-performance-list" role="table" aria-label="Şehir valiliği davet performansı listesi"><div className="admin-referral-performance-row admin-referral-performance-head" role="row"><span>Şehir</span><span>Marka</span><span>Durum</span><span>Destek</span><span>Oluşturuldu</span></div>{performance.data.entries.map(entry => <div className="admin-referral-performance-row" role="row" key={entry.applicationId}><b>{cityName(entry.cityCode)}</b><span>{entry.brandName}</span><span className={`admin-application-status ${entry.status}`}>{statusLabel(entry.status)}</span><strong>{entry.qualifiedSupporters}</strong><time>{formatDate(entry.createdAt)}</time></div>)}</div> : <div className="admin-empty-note"><Sparkles size={17} /> Henüz oluşturulmuş davet bağlantısı yok.</div>}
    </section>}
  </div></DashboardLayout>;
}
