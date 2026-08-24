import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { CITY_BY_CODE } from "@shared/cities";
import { ArrowLeft, CircleAlert, Clock3, FileText, ShieldCheck } from "lucide-react";
import React from "react";
import { Link } from "wouter";

const statusLabel = { pending: "İnceleniyor", approved: "Onaylandı", rejected: "Reddedildi", removed: "Yayından kaldırıldı" } as const;

function cityName(code: string) {
  return CITY_BY_CODE[code as keyof typeof CITY_BY_CODE]?.name ?? code;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export default function MyApplications() {
  const { user, loading } = useAuth();
  const applicationsQuery = trpc.cityGovernorApplications.mine.useQuery(undefined, { enabled: Boolean(user) });
  const attachmentMutation = trpc.cityGovernorApplications.attachmentUrl.useMutation();

  const openAttachment = (applicationId: number) => {
    attachmentMutation.mutate({ applicationId }, {
      onSuccess: result => {
        const tab = window.open(result.url, "_blank", "noopener,noreferrer");
        if (tab) tab.opener = null;
      },
    });
  };

  if (loading) return <div className="applications-access-state">Başvuruların hazırlanıyor…</div>;
  if (!user) {
    return <div className="applications-access-state"><ShieldCheck size={28} /><h1>Başvurularını görmek için giriş yap.</h1><p>Şehir Valisi başvurularının güncel durumunu yalnızca kendi oturumundan takip edebilirsin.</p><Button onClick={startLogin}>Kayıt ol / Giriş yap</Button><Link href="/">Ana sayfaya dön</Link></div>;
  }

  return (
    <div className="site-shell applications-page">
      <header className="applications-header">
        <Link href="/" className="brand"><span className="brand-flag">tr</span><span>sehrim<span className="brand-dot">.</span>lol</span></Link>
        <div className="applications-header-actions"><ThemeToggle /><Link href="/" className="applications-back"><ArrowLeft size={15} /> Ana sayfa</Link></div>
      </header>
      <main className="applications-main">
        <header className="applications-hero">
          <div><div className="eyebrow"><span /> ŞEHİR VALİSİ BAŞVURULARI</div><h1>Başvurular<em>ım.</em></h1><p>Başvurunun inceleme durumunu, yönetici notunu ve eklediğin dosyayı tek yerde takip et.</p></div>
          <div className="applications-user-chip"><span>{user.name?.slice(0, 1).toUpperCase() ?? "K"}</span><div><b>{user.name ?? "Kullanıcı"}</b><small>Hesabına ait başvurular</small></div></div>
        </header>
        {applicationsQuery.isLoading ? <div className="applications-loading">Başvuruların yükleniyor…</div> : applicationsQuery.isError || !applicationsQuery.data ? <div className="applications-error"><CircleAlert size={20} /><div><b>Başvurular yüklenemedi.</b><span>{applicationsQuery.error?.message ?? "Lütfen tekrar dene."}</span></div></div> : applicationsQuery.data.length ? <section className="applications-list" aria-label="Şehir Valisi başvurularım">
          {applicationsQuery.data.map(application => <article className="application-card" key={application.id}>
            <header><div><span className={`application-status ${application.status}`}><Clock3 size={13} /> {statusLabel[application.status]}</span><h2>{cityName(application.cityCode)} için <em>{application.brandName}</em></h2></div><time>Güncellendi: {formatDate(application.updatedAt)}</time></header>
            <div className="application-card-grid"><div><small>WEB ADRESİ</small><a href={application.website} target="_blank" rel="noreferrer">{application.website}</a></div><div><small>BAŞVURU NOTU</small><p>{application.message}</p></div></div>
            {application.attachmentName ? <button className="application-attachment" type="button" onClick={() => openAttachment(application.id)} disabled={attachmentMutation.isPending}><FileText size={16} /> {attachmentMutation.isPending ? "Dosya açılıyor…" : application.attachmentName}</button> : null}
            {application.decisionNote ? <div className={`application-decision ${application.status}`}><b>Yönetici notu</b><p>{application.decisionNote}</p></div> : null}
          </article>)}
        </section> : <section className="applications-empty"><FileText size={24} /><h2>Henüz başvurun yok.</h2><p>Haritada bir şehir seçip Şehir Valisi Ol adımından ilk başvurunu iletebilirsin.</p><Link href="/">Şehirleri keşfet</Link></section>}
      </main>
    </div>
  );
}
