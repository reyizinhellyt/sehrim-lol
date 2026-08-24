import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CITY_BY_CODE } from "@shared/cities";
import { groupHallOfFameByDate } from "@shared/adminPresentation";
import "@/admin.css";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Crown,
  Landmark,
  Loader2,
  MapPinned,
  ShieldAlert,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react";
import React from "react";
import { Link } from "wouter";

function cityName(cityCode: string) {
  return CITY_BY_CODE[cityCode as keyof typeof CITY_BY_CODE]?.name ?? cityCode;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Henüz işlenmedi";
  return new Date(value).toLocaleString("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function MetricCard({ label, value, note, icon: Icon, tone = "teal" }: {
  label: string;
  value: number;
  note: string;
  icon: React.ElementType;
  tone?: "teal" | "orange" | "blue" | "sand";
}) {
  return (
    <article className={`admin-metric-card ${tone}`}>
      <div className="admin-metric-icon"><Icon size={18} /></div>
      <span>{label}</span>
      <strong>{value.toLocaleString("tr-TR")}</strong>
      <small>{note}</small>
    </article>
  );
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const overview = trpc.admin.overview.useQuery(undefined, {
    enabled: isAdmin,
    refetchInterval: 30_000,
  });

  if (authLoading) {
    return <div className="admin-access-state"><Loader2 className="animate-spin" /> Yönetici oturumu kontrol ediliyor…</div>;
  }

  if (!user) {
    return (
      <div className="admin-access-state">
        <ShieldAlert size={28} />
        <h1>Yönetim alanı korumalıdır.</h1>
        <p>Yönetim ekranına erişmek için yetkili bir hesapla giriş yapmalısın.</p>
        <Link href="/">Ana sayfaya dön</Link>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-state">
        <ShieldAlert size={28} />
        <h1>Bu alan için yetkin yok.</h1>
        <p>Yarış verileri yalnızca yönetici rolüne atanmış hesaplar tarafından görüntülenebilir.</p>
        <Link href="/">Ana sayfaya dön</Link>
      </div>
    );
  }

  const archiveDays = groupHallOfFameByDate(overview.data?.hallOfFame ?? []).slice(0, 3);

  return (
    <DashboardLayout>
      <div className="admin-dashboard">
        <header className="admin-page-header">
          <div>
            <div className="admin-eyebrow"><ShieldAlert size={14} /> YÖNETİM ALANI</div>
            <h1>Günlük yarış <em>merkezinde.</em></h1>
            <p>Bugünün şehir yarışı, katılım sağlığı ve arşiv durumu tek ekranda.</p>
          </div>
          <div className="admin-header-actions">
            <span className="admin-live-status"><span /> Canlı veri</span>
            <ThemeToggle />
            <Link href="/" className="admin-site-link">Siteyi görüntüle <ArrowUpRight size={15} /></Link>
          </div>
        </header>

        {overview.isLoading ? (
          <div className="admin-loading-panel"><Loader2 className="animate-spin" /> Yarış verileri yükleniyor…</div>
        ) : overview.isError || !overview.data ? (
          <div className="admin-error-panel"><CircleAlert size={22} /><div><strong>Yönetim verileri yüklenemedi.</strong><span>{overview.error?.message ?? "Lütfen sayfayı yeniden dene."}</span></div></div>
        ) : (
          <>
            <section className="admin-summary-strip">
              <div><CalendarClock size={17} /><span><b>Yarış günü</b>{overview.data.recordDate}</span></div>
              <div><Activity size={17} /><span><b>Güncelleme</b>30 saniyede bir yenilenir</span></div>
              <div><MapPinned size={17} /><span><b>Lider şehir</b>{overview.data.leaderboard[0]?.cityName ?? "Henüz yok"}</span></div>
            </section>

            <section className="admin-metrics-grid">
              <MetricCard icon={Activity} label="Bugünkü katılım" value={overview.data.metrics.dailyParticipations} note="Tekil günlük oy" tone="orange" />
              <MetricCard icon={Landmark} label="Aktif şehir" value={overview.data.metrics.activeCities} note="Bugün puan alan il" tone="teal" />
              <MetricCard icon={Users} label="Kayıtlı kullanıcı" value={overview.data.metrics.registeredUsers} note={`${overview.data.metrics.representedUsers} kişi ilini seçti`} tone="blue" />
              <MetricCard icon={BarChart3} label="Temsil oranı" value={overview.data.metrics.registeredUsers ? Math.round((overview.data.metrics.representedUsers / overview.data.metrics.registeredUsers) * 100) : 0} note="İl seçimini tamamlayanlar" tone="sand" />
            </section>

            <section className="admin-content-grid">
              <article className="admin-panel admin-ranking-panel">
                <div className="admin-panel-title"><div><span>BUGÜNÜN SIRALAMASI</span><h2>İlk 10 şehir</h2></div><Trophy size={20} /></div>
                <div className="admin-ranking-list">
                  {overview.data.leaderboard.map(city => (
                    <div className={`admin-ranking-row rank-${city.rank}`} key={city.cityCode}>
                      <span className="admin-rank-number">{String(city.rank).padStart(2, "0")}</span>
                      <div className="admin-city-name"><b>{city.cityName}</b><small>{city.leader?.name ?? "Lider bekleniyor"}</small></div>
                      <div className="admin-progress"><span style={{ width: `${Math.max(4, (city.totalPoints / Math.max(1, overview.data.leaderboard[0]?.totalPoints ?? 1)) * 100)}%` }} /></div>
                      <strong>{city.totalPoints}</strong>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="admin-right-stack">
                <article className="admin-panel admin-rollover-card">
                  <div className="admin-panel-title"><div><span>GÜNLÜK SİSTEM</span><h2>Rollover görevi</h2></div><CalendarClock size={20} /></div>
                  <div className={`admin-job-state ${overview.data.rollover.configured ? "ready" : "warning"}`}>
                    {overview.data.rollover.configured ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
                    <div><b>{overview.data.rollover.configured ? "Etkin" : "Yapılandırılmadı"}</b><span>Türkiye saatiyle her gece 00:00</span></div>
                  </div>
                  <p>Son işlenen gün: <b>{overview.data.rollover.lastProcessedDate ?? "Henüz işlenmedi"}</b></p>
                  <small>Son kontrol: {formatDate(overview.data.rollover.updatedAt)}</small>
                </article>

                <article className="admin-panel admin-archive-card">
                  <div className="admin-panel-title"><div><span>HALL OF FAME</span><h2>Son arşiv</h2></div><Crown size={20} /></div>
                  {archiveDays.length ? (
                    <div className="admin-history-list">
                      {archiveDays.map(day => (
                        <div className="admin-archive-day" key={day.recordDate}>
                          <div className="admin-archive-date">{formatDate(day.recordDate).replace(", 12:00", "")}</div>
                          {day.results.slice(0, 3).map(item => <div className="admin-archive-row" key={`${item.recordDate}-${item.cityCode}`}><span>#{item.cityRank}</span><div><b>{cityName(item.cityCode)}</b><small>{item.cityLeaderName}</small></div><strong>{item.totalPoints}</strong></div>)}
                        </div>
                      ))}
                    </div>
                  ) : <div className="admin-empty-note"><Sparkles size={17} /> İlk gece arşivlendiğinde sonuçlar burada görünecek.</div>}
                </article>
              </aside>
            </section>

            <section className="admin-panel admin-recent-panel">
              <div className="admin-panel-title"><div><span>SON KATILIMLAR</span><h2>Bugünün akışı</h2></div><Activity size={20} /></div>
              {overview.data.recentParticipations.length ? (
                <div className="admin-recent-list">
                  {overview.data.recentParticipations.map(item => <div className="admin-recent-row" key={item.id}><span className="recent-dot" /><b>{item.userName}</b><span>{cityName(item.cityCode)}</span><time>{formatDate(item.createdAt)}</time></div>)}
                </div>
              ) : <div className="admin-empty-note"><Sparkles size={17} /> Bugün henüz katılım kaydedilmedi.</div>}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
