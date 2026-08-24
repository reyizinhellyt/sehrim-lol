import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CITY_BY_CODE } from "@shared/cities";
import "@/admin.css";
import { downloadAdminUsersWord } from "@/lib/adminUsersWordExport";
import { trpc } from "@/lib/trpc";
import { ArrowDownToLine, ArrowUpRight, CircleAlert, Mail, MapPinned, ShieldAlert, UserRoundCheck, UsersRound } from "lucide-react";
import React from "react";
import { Link } from "wouter";

function cityName(cityCode: string | null) {
  if (!cityCode) return "İl seçilmedi";
  return CITY_BY_CODE[cityCode as keyof typeof CITY_BY_CODE]?.name ?? cityCode;
}

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Bilinmiyor";
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const usersQuery = trpc.admin.users.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });
  const [isExporting, setIsExporting] = React.useState(false);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const handleWordDownload = async () => {
    if (!usersQuery.data?.length || isExporting) return;
    setIsExporting(true);
    setExportError(null);
    try {
      await downloadAdminUsersWord(usersQuery.data.map(member => ({
        name: member.name,
        email: member.email,
        role: member.role,
        cityName: cityName(member.cityCode),
        loginMethod: member.loginMethod,
        createdAt: member.createdAt,
        lastSignedIn: member.lastSignedIn,
      })));
    } catch {
      setExportError("Word belgesi oluşturulamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsExporting(false);
    }
  };

  if (authLoading) return <div className="admin-access-state">Yönetici oturumu kontrol ediliyor…</div>;
  if (!user || !isAdmin) {
    return <div className="admin-access-state"><ShieldAlert size={28} /><h1>Bu alan için yetkin yok.</h1><p>Kayıtlı kullanıcı bilgileri yalnızca yönetici rolüne atanmış hesaplar tarafından görüntülenebilir.</p><Link href="/">Ana sayfaya dön</Link></div>;
  }

  return (
    <DashboardLayout>
      <div className="admin-dashboard admin-users-dashboard">
        <header className="admin-page-header">
          <div>
            <div className="admin-eyebrow"><UsersRound size={14} /> KAYITLI KULLANICI YÖNETİMİ</div>
            <h1>Kullanıcı <em>kayıtları.</em></h1>
            <p>Kimlik, iletişim, rol, temsil ili ve oturum bilgileri yalnızca bu yönetim ekranında görünür.</p>
          </div>
          <div className="admin-header-actions"><ThemeToggle /><button type="button" className="admin-export-button" onClick={handleWordDownload} disabled={!usersQuery.data?.length || isExporting}><ArrowDownToLine size={15} /> {isExporting ? "Belge hazırlanıyor…" : "Word olarak indir"}</button><Link href="/" className="admin-site-link">Siteyi görüntüle <ArrowUpRight size={15} /></Link></div>
        </header>
        {exportError ? <div className="admin-export-error" role="alert">{exportError}</div> : null}

        {usersQuery.isLoading ? <div className="admin-loading-panel">Kullanıcı kayıtları yükleniyor…</div> : usersQuery.isError || !usersQuery.data ? (
          <div className="admin-error-panel"><CircleAlert size={22} /><div><strong>Kullanıcı kayıtları yüklenemedi.</strong><span>{usersQuery.error?.message ?? "Lütfen sayfayı yeniden dene."}</span></div></div>
        ) : (
          <section className="admin-panel admin-users-panel" aria-label="Kayıtlı kullanıcılar">
            <div className="admin-panel-title"><div><span>KORUMALI KULLANICI LİSTESİ</span><h2>{usersQuery.data.length} kayıtlı kullanıcı</h2></div><UserRoundCheck size={20} /></div>
            {usersQuery.data.length ? (
              <div className="admin-users-table" role="table" aria-label="Kayıtlı kullanıcı listesi">
                <div className="admin-user-row admin-user-head" role="row"><span role="columnheader">Kullanıcı</span><span role="columnheader">Rol</span><span role="columnheader">Temsil ili</span><span role="columnheader">Giriş yöntemi</span><span role="columnheader">Kayıt</span><span role="columnheader">Son oturum</span></div>
                {usersQuery.data.map(member => (
                  <div className="admin-user-row" role="row" key={member.id}>
                    <div className="admin-user-identity" role="cell"><b>{member.name}</b><span>{member.email ? <><Mail size={12} /> {member.email}</> : "E-posta bilgisi yok"}</span></div>
                    <span role="cell" className={`admin-role-badge ${member.role}`}>{member.role === "admin" ? "Yönetici" : "Kullanıcı"}</span>
                    <span role="cell" className="admin-user-city"><MapPinned size={13} /> {cityName(member.cityCode)}</span>
                    <span role="cell">{member.loginMethod}</span>
                    <time role="cell">{formatDate(member.createdAt)}</time>
                    <time role="cell">{formatDate(member.lastSignedIn)}</time>
                  </div>
                ))}
              </div>
            ) : <div className="admin-empty-note"><UsersRound size={17} /> Henüz kayıtlı kullanıcı yok.</div>}
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
