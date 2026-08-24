export type AdminUserExportRow = {
  name: string;
  email: string | null;
  role: "admin" | "user";
  cityName: string;
  loginMethod: string;
  createdAt: Date | string;
  lastSignedIn: Date | string;
};

export const ADMIN_USERS_WORD_HEADERS = ["Kullanıcı", "E-posta", "Rol", "Temsil ili", "Giriş yöntemi", "Kayıt", "Son oturum"] as const;

function formatDate(value: Date | string) {
  return new Date(value).toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" });
}

export function getAdminUsersExportFilename(date = new Date()) {
  return `sehrim-lol-kayitli-kullanicilar-${date.toISOString().slice(0, 10)}.docx`;
}

export function getAdminUsersWordRows(users: AdminUserExportRow[]) {
  return users.map(member => [
    member.name,
    member.email ?? "E-posta bilgisi yok",
    member.role === "admin" ? "Yönetici" : "Kullanıcı",
    member.cityName,
    member.loginMethod,
    formatDate(member.createdAt),
    formatDate(member.lastSignedIn),
  ]);
}

export function getAdminUsersWordSummary(users: AdminUserExportRow[], generatedAt = new Date()) {
  return `Oluşturulma: ${formatDate(generatedAt)} • ${users.length} kayıt`;
}

export async function downloadAdminUsersWord(users: AdminUserExportRow[], generatedAt = new Date()) {
  const { AlignmentType, Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } = await import("docx");
  const headerCell = (text: string) => new TableCell({
    shading: { fill: "174951", type: ShadingType.CLEAR },
    children: [new Paragraph({ children: [new TextRun({ text, color: "FFFFFF", bold: true, size: 18 })] })],
  });
  const bodyCell = (text: string) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, size: 17 })] })] });

  const wordDocument = new Document({
    sections: [{
      properties: { page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } } },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 160 },
          children: [new TextRun({ text: "sehrim.lol", bold: true, color: "174951", size: 30 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "Kayıtlı Kullanıcı Listesi", bold: true, size: 28 })],
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 320 },
          children: [new TextRun({ text: getAdminUsersWordSummary(users, generatedAt), color: "526B6E", size: 18 })],
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ tableHeader: true, children: ADMIN_USERS_WORD_HEADERS.map(headerCell) }),
            ...getAdminUsersWordRows(users).map(row => new TableRow({ children: row.map(bodyCell) })),
          ],
        }),
        new Paragraph({
          spacing: { before: 280 },
          children: [new TextRun({ text: "Gizli yönetim belgesi. Bu dosya yalnızca yetkili kullanıcılar için oluşturulmuştur.", italics: true, color: "526B6E", size: 16 })],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(wordDocument);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = getAdminUsersExportFilename(generatedAt);
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
