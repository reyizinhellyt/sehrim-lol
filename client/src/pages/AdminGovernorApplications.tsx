import DashboardLayout from "@/components/DashboardLayout";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { CITY_BY_CODE } from "@shared/cities";
import "@/admin.css";
import { ArrowUpRight, Check, CircleAlert, EyeOff, FileText, MapPinned, RotateCcw, ShieldAlert, X } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";

const statusLabel = { pending: "İnceleniyor", approved: "Onaylandı", rejected: "Reddedildi", removed: "Yayından kaldırıldı" } as const;

function cityName(code: string) { return CITY_BY_CODE[code as keyof typeof CITY_BY_CODE]?.name ?? code; }
function formatDate(value: Date | string | null) { return value ? new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" }) : "—"; }

export default function AdminGovernorApplications() {
  const { user, loading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const applicationsQuery = trpc.admin.cityGovernorApplications.useQuery(undefined, { enabled: isAdmin, refetchInterval: 30_000 });
  const reviewMutation = trpc.admin.reviewCityGovernorApplication.useMutation();
  const removeMutation = trpc.admin.removeApprovedCityGovernorApplication.useMutation();
  const reopenMutation = trpc.admin.reopenRemovedCityGovernorApplication.useMutation();
  const attachmentMutation = trpc.cityGovernorApplications.attachmentUrl.useMutation();
  const [notes, setNotes] = useState<Record<number, string>>({});

  const review = (applicationId: number, status: "approved" | "rejected") => {
    reviewMutation.mutate({ applicationId, status, decisionNote: notes[applicationId] || undefined }, { onSuccess: () => utils.admin.cityGovernorApplications.invalidate() });
  };
  const remove = (applicationId: number) => removeMutation.mutate({ applicationId }, { onSuccess: () => utils.admin.cityGovernorApplications.invalidate() });
  const reopen = (applicationId: number) => reopenMutation.mutate({ applicationId }, { onSuccess: () => utils.admin.cityGovernorApplications.invalidate() });
  const openAttachment = (applicationId: number) => attachmentMutation.mutate({ applicationId }, { onSuccess: result => { const tab = window.open(result.url, "_blank", "noopener,noreferrer"); if (tab) tab.opener = null; } });

  if (loading) return <div className="admin-access-state">Yönetici oturumu kontrol ediliyor…</div>;
  if (!user || !isAdmin) return <div className="admin-access-state"><ShieldAlert size={28} /><h1>Bu alan için yetkin yok.</h1><p>Şehir Valisi başvuruları yalnızca yönetici rolüne atanmış hesaplar tarafından incelenebilir.</p><Link href="/">Ana sayfaya dön</Link></div>;

  return <DashboardLayout><div className="admin-dashboard admin-governor-applications-dashboard">
    <header className="admin-page-header"><div><div className="admin-eyebrow"><Check size={14} /> ŞEHİR VALİSİ BAŞVURU YÖNETİMİ</div><h1>Başvuru <em>inceleme.</em></h1><p>Gelen başvuruları, ekleri ve kullanıcı iletişim bilgisini buradan değerlendirip onaylayabilir veya reddedebilirsin.</p></div><div className="admin-header-actions"><ThemeToggle /><Link href="/" className="admin-site-link">Siteyi görüntüle <ArrowUpRight size={15} /></Link></div></header>
    {applicationsQuery.isLoading ? <div className="admin-loading-panel">Başvurular yükleniyor…</div> : applicationsQuery.isError || !applicationsQuery.data ? <div className="admin-error-panel"><CircleAlert size={22} /><div><strong>Başvurular yüklenemedi.</strong><span>{applicationsQuery.error?.message ?? "Lütfen tekrar dene."}</span></div></div> : applicationsQuery.data.length ? <section className="admin-governor-applications-list" aria-label="Şehir Valisi başvuruları">
      {applicationsQuery.data.map(application => <article className="admin-governor-application" key={application.id}>
        <header><div><span className={`admin-application-status ${application.status}`}>{statusLabel[application.status]}</span><h2>{application.brandName} <small>· {cityName(application.cityCode)}</small></h2></div><time>{formatDate(application.createdAt)}</time></header>
        <div className="admin-application-contact"><span>{application.applicantName?.trim() || "İsimsiz kullanıcı"}</span><a href={`mailto:${application.contactEmail}`}>{application.contactEmail}</a><a href={application.website} target="_blank" rel="noreferrer">{application.website}</a><span><MapPinned size={13} /> {cityName(application.cityCode)}</span></div>
        <p className="admin-application-message">{application.message}</p>
        {application.attachmentName ? <button className="admin-application-attachment" type="button" onClick={() => openAttachment(application.id)} disabled={attachmentMutation.isPending}><FileText size={15} /> {attachmentMutation.isPending ? "Dosya açılıyor…" : application.attachmentName}</button> : null}
        {application.status === "pending" ? <div className="admin-application-actions"><label>Karar notu (isteğe bağlı)<textarea value={notes[application.id] ?? ""} maxLength={1000} onChange={event => setNotes(current => ({ ...current, [application.id]: event.target.value }))} placeholder="Başvuru sahibine iletilecek kısa not…" /></label><div><button type="button" className="admin-application-reject" onClick={() => review(application.id, "rejected")} disabled={reviewMutation.isPending}><X size={15} /> Reddet</button><button type="button" className="admin-application-approve" onClick={() => review(application.id, "approved")} disabled={reviewMutation.isPending}><Check size={15} /> Onayla</button></div></div> : <div className={`admin-application-decision ${application.status}`}><b>{application.status === "approved" ? "Onaylandı" : application.status === "removed" ? "Yayından kaldırıldı" : "Reddedildi"}</b><span>{application.decisionNote || "Yönetici notu eklenmedi."}</span><time>Karar: {formatDate(application.reviewedAt)}</time>{application.status === "approved" ? <button type="button" className="admin-application-remove" onClick={() => remove(application.id)} disabled={removeMutation.isPending}><EyeOff size={14} /> {removeMutation.isPending ? "Kaldırılıyor…" : "Yayından kaldır"}</button> : application.status === "removed" ? <button type="button" className="admin-application-reopen" onClick={() => reopen(application.id)} disabled={reopenMutation.isPending}><RotateCcw size={14} /> {reopenMutation.isPending ? "Açılıyor…" : "Yeniden incelemeye al"}</button> : null}</div>}
      </article>)}
    </section> : <div className="admin-empty-note"><FileText size={17} /> Henüz incelenecek Şehir Valisi başvurusu yok.</div>}
  </div></DashboardLayout>;
}
