import { randomBytes } from "node:crypto";
import { and, asc, desc, eq, lt, ne, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  dailyArchives,
  dailyCityScores,
  dailyUserScores,
  cityGovernorApplications,
  cityGovernorHistory,
  cityGovernorReferralConversions,
  onlineSessions,
  participations,
  siteMetrics,
  systemJobs,
  type InsertUser,
  userProfiles,
  users,
} from "@shared/_core";
import { CITY_BY_CODE } from "../shared/cities";
import {
  DAILY_PARTICIPATION_LIMIT,
  getPreviousTurkeyDate,
  getTurkeyDate,
  rankCities,
} from "../shared/gameLogic";
import {
  hasRemainingDailyParticipation,
  maySelectRepresentativeCity,
  participationCityForUser,
} from "../shared/participationRules";
import { ENV } from "./_core/env";
import { storageGet, storagePut } from "./storage";

let _db: ReturnType<typeof drizzle> | null = null;

export const DAILY_ROLLOVER_JOB_KEY = "turkey-daily-rollover";
const TOTAL_VISITS_METRIC_KEY = "total-visits";
const ONLINE_SESSION_TTL_MS = 75_000;
const PUBLIC_SPONSOR_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
type CityGovernorHistoryChangeType = "replaced" | "removed" | "revoked";

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Veritabanı bağlantısı kullanılamıyor.");
  return db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach(field => {
    if (user[field] !== undefined) {
      const value = user[field] ?? null;
      values[field] = value;
      updateSet[field] = value;
    }
  });
  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = "admin";
    updateSet.role = "admin";
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

export type CityGovernorApplicationInput = {
  cityCode: string;
  brandName: string;
  contactEmail: string;
  website: string;
  message: string;
  attachment?: {
    fileName: string;
    contentType: "image/png" | "image/jpeg" | "image/webp" | "application/pdf";
    dataBase64: string;
  };
};

function createCityGovernorReferralCode() {
  return `gv_${randomBytes(18).toString("base64url")}`;
}

export async function submitCityGovernorApplication(userId: number, input: CityGovernorApplicationInput) {
  const database = await requireDb();
  const existing = await database
    .select({ id: cityGovernorApplications.id, status: cityGovernorApplications.status, referralCode: cityGovernorApplications.referralCode })
    .from(cityGovernorApplications)
    .where(and(eq(cityGovernorApplications.userId, userId), eq(cityGovernorApplications.cityCode, input.cityCode)))
    .limit(1);
  if (existing[0]?.status === "approved") {
    throw new Error("Onaylanmış bir Şehir Valisi başvurusu güncellenemez.");
  }

  const referralCode = existing[0]?.referralCode ?? createCityGovernorReferralCode();
  let attachmentValues: Partial<typeof cityGovernorApplications.$inferInsert> = {};
  if (input.attachment) {
    const bytes = Buffer.from(input.attachment.dataBase64, "base64");
    if (!bytes.length || bytes.length > 3 * 1024 * 1024) {
      throw new Error("Dosya en fazla 3 MB olabilir.");
    }
    const safeName = input.attachment.fileName.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-160) || "tanitim-dosyasi";
    const stored = await storagePut(
      `city-governor-applications/${userId}/${Date.now()}-${safeName}`,
      bytes,
      input.attachment.contentType,
    );
    attachmentValues = {
      attachmentKey: stored.key,
      attachmentName: input.attachment.fileName,
      attachmentContentType: input.attachment.contentType,
    };
  }
  await database
    .insert(cityGovernorApplications)
    .values({
      userId,
      cityCode: input.cityCode,
      brandName: input.brandName,
      contactEmail: input.contactEmail,
      website: input.website,
      message: input.message,
      referralCode,
      status: "pending",
      ...attachmentValues,
    })
    .onDuplicateKeyUpdate({
      set: {
        brandName: input.brandName,
        contactEmail: input.contactEmail,
        website: input.website,
        message: input.message,
        referralCode,
        ...attachmentValues,
        status: "pending",
        decisionNote: null,
        reviewedByUserId: null,
        reviewedAt: null,
        updatedAt: new Date(),
      },
    });

  return { status: "pending" as const, referralCode };
}

export async function getMyCityGovernorReferralProgress(userId: number, cityCode: string) {
  const database = await requireDb();
  const application = await database
    .select({ id: cityGovernorApplications.id, referralCode: cityGovernorApplications.referralCode })
    .from(cityGovernorApplications)
    .where(and(eq(cityGovernorApplications.userId, userId), eq(cityGovernorApplications.cityCode, cityCode)))
    .limit(1);
  if (!application[0]?.referralCode) return null;

  const qualified = await database
    .select({ total: sql<number>`count(*)` })
    .from(cityGovernorReferralConversions)
    .where(eq(cityGovernorReferralConversions.applicationId, application[0].id));
  return {
    referralCode: application[0].referralCode,
    qualifiedSupporters: Number(qualified[0]?.total ?? 0),
  };
}

export async function getAdminCityGovernorReferralPerformance() {
  const database = await requireDb();
  const rows = await database
    .select({
      applicationId: cityGovernorApplications.id,
      cityCode: cityGovernorApplications.cityCode,
      brandName: cityGovernorApplications.brandName,
      status: cityGovernorApplications.status,
      createdAt: cityGovernorApplications.createdAt,
      qualifiedSupporters: sql<number>`count(${cityGovernorReferralConversions.id})`,
    })
    .from(cityGovernorApplications)
    .leftJoin(cityGovernorReferralConversions, eq(cityGovernorReferralConversions.applicationId, cityGovernorApplications.id))
    .where(sql`${cityGovernorApplications.referralCode} is not null`)
    .groupBy(
      cityGovernorApplications.id,
      cityGovernorApplications.cityCode,
      cityGovernorApplications.brandName,
      cityGovernorApplications.status,
      cityGovernorApplications.createdAt,
    )
    .orderBy(desc(sql`count(${cityGovernorReferralConversions.id})`), desc(cityGovernorApplications.createdAt));

  const entries = rows.map(row => ({ ...row, qualifiedSupporters: Number(row.qualifiedSupporters ?? 0) }));
  return {
    totalLinks: entries.length,
    totalQualifiedSupporters: entries.reduce((total, entry) => total + entry.qualifiedSupporters, 0),
    entries,
  };
}

const cityGovernorApplicationFields = {
  id: cityGovernorApplications.id,
  userId: cityGovernorApplications.userId,
  cityCode: cityGovernorApplications.cityCode,
  brandName: cityGovernorApplications.brandName,
  contactEmail: cityGovernorApplications.contactEmail,
  website: cityGovernorApplications.website,
  message: cityGovernorApplications.message,
  attachmentKey: cityGovernorApplications.attachmentKey,
  attachmentName: cityGovernorApplications.attachmentName,
  attachmentContentType: cityGovernorApplications.attachmentContentType,
  status: cityGovernorApplications.status,
  decisionNote: cityGovernorApplications.decisionNote,
  reviewedByUserId: cityGovernorApplications.reviewedByUserId,
  reviewedAt: cityGovernorApplications.reviewedAt,
  createdAt: cityGovernorApplications.createdAt,
  updatedAt: cityGovernorApplications.updatedAt,
};

export async function getMyCityGovernorApplications(userId: number) {
  const database = await requireDb();
  return database
    .select(cityGovernorApplicationFields)
    .from(cityGovernorApplications)
    .where(eq(cityGovernorApplications.userId, userId))
    .orderBy(desc(cityGovernorApplications.updatedAt));
}

export async function getApprovedCityGovernorSponsors() {
  const database = await requireDb();
  const rows = await database
    .select({
      cityCode: cityGovernorApplications.cityCode,
      brandName: cityGovernorApplications.brandName,
      website: cityGovernorApplications.website,
      message: cityGovernorApplications.message,
      attachmentKey: cityGovernorApplications.attachmentKey,
      attachmentContentType: cityGovernorApplications.attachmentContentType,
      updatedAt: cityGovernorApplications.updatedAt,
    })
    .from(cityGovernorApplications)
    .where(eq(cityGovernorApplications.status, "approved"))
    .orderBy(desc(cityGovernorApplications.updatedAt));

  const sponsorsByCity = new Map<string, (typeof rows)[number]>();
  for (const row of rows) {
    if (!sponsorsByCity.has(row.cityCode)) sponsorsByCity.set(row.cityCode, row);
  }
  return Promise.all(Array.from(sponsorsByCity.values()).map(async ({ cityCode, brandName, website, message, attachmentKey, attachmentContentType }) => ({
    cityCode,
    brandName,
    website,
    message,
    ...(attachmentKey && attachmentContentType && PUBLIC_SPONSOR_LOGO_TYPES.has(attachmentContentType)
      ? { logoUrl: (await storageGet(attachmentKey)).url }
      : {}),
  })));
}

export async function getFormerCityGovernorHistory() {
  const database = await requireDb();
  const rows = await database
    .select({
      cityCode: cityGovernorHistory.cityCode,
      brandName: cityGovernorHistory.brandName,
      website: cityGovernorHistory.website,
      message: cityGovernorHistory.message,
      attachmentKey: cityGovernorHistory.attachmentKey,
      attachmentContentType: cityGovernorHistory.attachmentContentType,
      changeType: cityGovernorHistory.changeType,
      archivedAt: cityGovernorHistory.archivedAt,
    })
    .from(cityGovernorHistory)
    .orderBy(desc(cityGovernorHistory.archivedAt))
    .limit(100);

  return Promise.all(rows.map(async ({ cityCode, brandName, website, message, attachmentKey, attachmentContentType, changeType, archivedAt }) => ({
    cityCode,
    brandName,
    website,
    message,
    changeType,
    archivedAt,
    ...(attachmentKey && attachmentContentType && PUBLIC_SPONSOR_LOGO_TYPES.has(attachmentContentType)
      ? { logoUrl: (await storageGet(attachmentKey)).url }
      : {}),
  })));
}

export async function getSitePulse(now: Date = new Date()) {
  const database = await requireDb();
  const activeAfter = new Date(now.getTime() - ONLINE_SESSION_TTL_MS);
  const [onlineRows, visitRows, voteRows] = await Promise.all([
    database
      .select({ total: sql<number>`count(*)` })
      .from(onlineSessions)
      .where(sql`${onlineSessions.lastSeenAt} >= ${activeAfter}`),
    database
      .select({ total: siteMetrics.metricValue })
      .from(siteMetrics)
      .where(eq(siteMetrics.metricKey, TOTAL_VISITS_METRIC_KEY))
      .limit(1),
    database.select({ total: sql<number>`coalesce(sum(${participations.points}), 0)` }).from(participations),
  ]);

  return {
    onlineCount: Number(onlineRows[0]?.total ?? 0),
    totalVisits: Number(visitRows[0]?.total ?? 0),
    totalVotes: Number(voteRows[0]?.total ?? 0),
  };
}

async function touchOnlineSession(sessionId: string, now: Date) {
  const database = await requireDb();
  await database.delete(onlineSessions).where(lt(onlineSessions.lastSeenAt, new Date(now.getTime() - ONLINE_SESSION_TTL_MS)));
  await database
    .insert(onlineSessions)
    .values({ sessionId, lastSeenAt: now })
    .onDuplicateKeyUpdate({ set: { lastSeenAt: now } });
}

export async function trackSiteVisit(sessionId: string, now: Date = new Date()) {
  const database = await requireDb();
  await touchOnlineSession(sessionId, now);
  await database
    .insert(siteMetrics)
    .values({ metricKey: TOTAL_VISITS_METRIC_KEY, metricValue: 1 })
    .onDuplicateKeyUpdate({ set: { metricValue: sql`${siteMetrics.metricValue} + 1`, updatedAt: now } });
  return getSitePulse(now);
}

export async function heartbeatOnlineSession(sessionId: string, now: Date = new Date()) {
  await touchOnlineSession(sessionId, now);
  return getSitePulse(now);
}

export async function getAdminCityGovernorApplications() {
  const database = await requireDb();
  return database
    .select({ ...cityGovernorApplicationFields, applicantName: users.name, applicantEmail: users.email })
    .from(cityGovernorApplications)
    .leftJoin(users, eq(cityGovernorApplications.userId, users.id))
    .orderBy(asc(cityGovernorApplications.status), desc(cityGovernorApplications.updatedAt));
}

export async function getCityGovernorApplicationAttachment(applicationId: number) {
  const database = await requireDb();
  const rows = await database
    .select({
      id: cityGovernorApplications.id,
      userId: cityGovernorApplications.userId,
      attachmentKey: cityGovernorApplications.attachmentKey,
      attachmentName: cityGovernorApplications.attachmentName,
      attachmentContentType: cityGovernorApplications.attachmentContentType,
    })
    .from(cityGovernorApplications)
    .where(eq(cityGovernorApplications.id, applicationId))
    .limit(1);
  return rows[0] ?? null;
}

type CityGovernorHistorySnapshot = {
  id: number;
  cityCode: string;
  brandName: string;
  website: string;
  message: string;
  attachmentKey: string | null;
  attachmentContentType: string | null;
};

async function archiveCityGovernorSnapshot(
  database: Awaited<ReturnType<typeof requireDb>>,
  application: CityGovernorHistorySnapshot,
  changeType: CityGovernorHistoryChangeType,
) {
  await database.insert(cityGovernorHistory).values({
    applicationId: application.id,
    cityCode: application.cityCode,
    brandName: application.brandName,
    website: application.website,
    message: application.message,
    attachmentKey: application.attachmentKey,
    attachmentContentType: application.attachmentContentType,
    changeType,
  });
}

const cityGovernorHistorySnapshotFields = {
  id: cityGovernorApplications.id,
  cityCode: cityGovernorApplications.cityCode,
  brandName: cityGovernorApplications.brandName,
  website: cityGovernorApplications.website,
  message: cityGovernorApplications.message,
  attachmentKey: cityGovernorApplications.attachmentKey,
  attachmentContentType: cityGovernorApplications.attachmentContentType,
};

export async function reviewCityGovernorApplication(applicationId: number, reviewerUserId: number, status: "approved" | "rejected", decisionNote: string | null) {
  const database = await requireDb();
  const application = await database
    .select({ status: cityGovernorApplications.status, ...cityGovernorHistorySnapshotFields })
    .from(cityGovernorApplications)
    .where(eq(cityGovernorApplications.id, applicationId))
    .limit(1);
  const currentApplication = application[0];
  if (!currentApplication) throw new Error("Başvuru bulunamadı.");

  if (status === "approved" && currentApplication.status !== "approved") {
    const previousGovernors = await database
      .select(cityGovernorHistorySnapshotFields)
      .from(cityGovernorApplications)
      .where(and(
        eq(cityGovernorApplications.cityCode, currentApplication.cityCode),
        eq(cityGovernorApplications.status, "approved"),
        ne(cityGovernorApplications.id, currentApplication.id),
      ));
    for (const previousGovernor of previousGovernors) {
      await archiveCityGovernorSnapshot(database, previousGovernor, "replaced");
      await database
        .update(cityGovernorApplications)
        .set({
          status: "removed",
          decisionNote: "Yeni bir Şehir Valisi onaylandığı için geçmişe taşındı.",
          reviewedByUserId: reviewerUserId,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(cityGovernorApplications.id, previousGovernor.id));
    }
  } else if (currentApplication.status === "approved" && status !== "approved") {
    await archiveCityGovernorSnapshot(database, currentApplication, "revoked");
  }

  await database
    .update(cityGovernorApplications)
    .set({ status, decisionNote, reviewedByUserId: reviewerUserId, reviewedAt: new Date(), updatedAt: new Date() })
    .where(eq(cityGovernorApplications.id, applicationId));
  return { status };
}

export async function removeApprovedCityGovernorApplication(applicationId: number, reviewerUserId: number) {
  const database = await requireDb();
  const application = await database
    .select({ status: cityGovernorApplications.status, ...cityGovernorHistorySnapshotFields })
    .from(cityGovernorApplications)
    .where(eq(cityGovernorApplications.id, applicationId))
    .limit(1);
  const currentApplication = application[0];
  if (!currentApplication) throw new Error("Başvuru bulunamadı.");
  if (currentApplication.status !== "approved") throw new Error("Yalnızca onaylı başvurular yayından kaldırılabilir.");
  await archiveCityGovernorSnapshot(database, currentApplication, "removed");
  await database
    .update(cityGovernorApplications)
    .set({
      status: "removed",
      decisionNote: "Yönetici tarafından yayından kaldırıldı. Başvuru kaydı korunuyor.",
      reviewedByUserId: reviewerUserId,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(cityGovernorApplications.id, applicationId));
  return { status: "removed" as const };
}

export async function reopenRemovedCityGovernorApplication(applicationId: number) {
  const database = await requireDb();
  const application = await database
    .select({ id: cityGovernorApplications.id, status: cityGovernorApplications.status })
    .from(cityGovernorApplications)
    .where(eq(cityGovernorApplications.id, applicationId))
    .limit(1);
  if (!application[0]) throw new Error("Başvuru bulunamadı.");
  if (application[0].status !== "removed") throw new Error("Yalnızca yayından kaldırılmış başvurular yeniden incelemeye alınabilir.");
  await database
    .update(cityGovernorApplications)
    .set({ status: "pending", decisionNote: null, reviewedByUserId: null, reviewedAt: null, updatedAt: new Date() })
    .where(eq(cityGovernorApplications.id, applicationId));
  return { status: "pending" as const };
}

export async function getUserProfile(userId: number) {
  const db = await requireDb();
  const result = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return result[0] ?? null;
}

export async function setRepresentativeCity(userId: number, cityCode: string) {
  if (!CITY_BY_CODE[cityCode as keyof typeof CITY_BY_CODE]) {
    throw new Error("Geçerli bir il seçmelisin.");
  }
  const currentProfile = await getUserProfile(userId);
  if (currentProfile) {
    if (currentProfile.cityCode === cityCode) return currentProfile;
    if (!maySelectRepresentativeCity(currentProfile.cityCode)) {
      throw new Error("Temsil edeceğin il seçildikten sonra beta süresince değiştirilemez.");
    }
  }
  const db = await requireDb();
  await db.insert(userProfiles).values({ userId, cityCode });
  return (await getUserProfile(userId))!;
}

type CityLeader = { userId: number; name: string; points: number } | null;

async function getDailyLeaderboardWithLeaders(recordDate: string = getTurkeyDate()) {
  const db = await requireDb();
  const scoreRows = await db
    .select({ cityCode: dailyCityScores.cityCode, totalPoints: dailyCityScores.totalPoints })
    .from(dailyCityScores)
    .where(eq(dailyCityScores.recordDate, recordDate));
  const pointsByCode = Object.fromEntries(scoreRows.map(row => [row.cityCode, row.totalPoints]));
  const leaders = await db
    .select({
      cityCode: dailyUserScores.cityCode,
      userId: dailyUserScores.userId,
      points: dailyUserScores.points,
      name: users.name,
    })
    .from(dailyUserScores)
    .leftJoin(users, eq(dailyUserScores.userId, users.id))
    .where(eq(dailyUserScores.recordDate, recordDate))
    .orderBy(asc(dailyUserScores.cityCode), desc(dailyUserScores.points), asc(dailyUserScores.userId));

  const leaderByCity = new Map<string, CityLeader>();
  for (const leader of leaders) {
    if (!leaderByCity.has(leader.cityCode)) {
      leaderByCity.set(leader.cityCode, {
        userId: leader.userId,
        name: leader.name?.trim() || "Şehir temsilcisi",
        points: leader.points,
      });
    }
  }

  return rankCities(pointsByCode).map(city => ({
    ...city,
    leader: leaderByCity.get(city.cityCode) ?? null,
  }));
}

export async function getDailyLeaderboard(recordDate: string = getTurkeyDate()) {
  const leaderboard = await getDailyLeaderboardWithLeaders(recordDate);
  return leaderboard.map(({ leader: _leader, ...city }) => city);
}

export async function getAllTimeLeaderboard() {
  const database = await requireDb();
  const scoreRows = await database
    .select({
      cityCode: participations.cityCode,
      totalPoints: sql<number>`coalesce(sum(${participations.points}), 0)`,
    })
    .from(participations)
    .groupBy(participations.cityCode);
  const totalVotes = scoreRows.reduce((sum, row) => sum + Number(row.totalPoints), 0);
  const pointsByCode = Object.fromEntries(scoreRows.map(row => [row.cityCode, Number(row.totalPoints)]));

  return {
    totalVotes,
    leaderboard: rankCities(pointsByCode).map(city => ({
      ...city,
      percentage: totalVotes > 0 ? Math.round((city.totalPoints / totalVotes) * 1000) / 10 : 0,
    })),
  };
}

export async function getDailyDashboard(userId?: number | null) {
  const db = await requireDb();
  const recordDate = getTurkeyDate();
  const [leaderboard, profile] = await Promise.all([
    getDailyLeaderboard(recordDate),
    userId ? getUserProfile(userId) : Promise.resolve(null),
  ]);
  const participation = profile && userId
    ? await db
        .select({
          points: dailyUserScores.points,
          participationCount: dailyUserScores.participationCount,
          lastParticipatedAt: dailyUserScores.lastParticipatedAt,
        })
        .from(dailyUserScores)
        .where(and(eq(dailyUserScores.recordDate, recordDate), eq(dailyUserScores.userId, userId)))
        .limit(1)
    : [];
  const current = participation[0];
  return {
    recordDate,
    leaderboard,
    profile: profile ? { cityCode: profile.cityCode, selectedAt: profile.selectedAt } : null,
    participation: profile
      ? {
          count: current?.participationCount ?? 0,
          points: current?.points ?? 0,
          remaining: Math.max(0, DAILY_PARTICIPATION_LIMIT - (current?.participationCount ?? 0)),
          lastParticipatedAt: current?.lastParticipatedAt ?? null,
        }
      : null,
  };
}

function isDuplicateEntry(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const databaseError = error as { code?: string; message?: string; cause?: unknown };
  if (databaseError.code === "ER_DUP_ENTRY") return true;
  if (typeof databaseError.message === "string" && /ER_DUP_ENTRY|duplicate entry|daily_voter_fingerprint_unique/i.test(databaseError.message)) return true;
  return isDuplicateEntry(databaseError.cause);
}

export async function addDailyParticipation(userId: number, referralCode?: string) {
  const db = await requireDb();
  const profile = await getUserProfile(userId);
  if (!profile) throw new Error("Puan vermeden önce temsil edeceğin ili seçmelisin.");
  const recordDate = getTurkeyDate();
  const earlierParticipation = await db
    .select({ id: participations.id })
    .from(participations)
    .where(eq(participations.userId, userId))
    .limit(1);
  const existing = await db
    .select({ id: participations.id })
    .from(participations)
    .where(and(eq(participations.recordDate, recordDate), eq(participations.userId, userId)))
    .limit(1);
  if (!hasRemainingDailyParticipation(existing.length)) {
    return { status: "already-participated" as const, recordDate };
  }

  let referralMatched = false;
  try {
    await db.transaction(async tx => {
      await tx.insert(participations).values({
        recordDate,
        userId,
        cityCode: participationCityForUser(profile.cityCode),
        points: 1,
      });
      await tx
        .insert(dailyUserScores)
        .values({
          recordDate,
          userId,
          cityCode: participationCityForUser(profile.cityCode),
          points: 1,
          participationCount: 1,
          lastParticipatedAt: new Date(),
        })
        .onDuplicateKeyUpdate({
          set: {
            points: sql`${dailyUserScores.points} + 1`,
            participationCount: sql`${dailyUserScores.participationCount} + 1`,
            lastParticipatedAt: new Date(),
          },
        });
      await tx
        .insert(dailyCityScores)
        .values({ recordDate, cityCode: participationCityForUser(profile.cityCode), totalPoints: 1 })
        .onDuplicateKeyUpdate({ set: { totalPoints: sql`${dailyCityScores.totalPoints} + 1` } });
      if (referralCode && earlierParticipation.length === 0) {
        const application = await tx
          .select({ id: cityGovernorApplications.id, userId: cityGovernorApplications.userId, cityCode: cityGovernorApplications.cityCode })
          .from(cityGovernorApplications)
          .where(eq(cityGovernorApplications.referralCode, referralCode))
          .limit(1);
        const matchedApplication = application[0];
        if (matchedApplication && matchedApplication.userId !== userId && matchedApplication.cityCode === profile.cityCode) {
          await tx
            .insert(cityGovernorReferralConversions)
            .values({ applicationId: matchedApplication.id, invitedUserId: userId })
            .onDuplicateKeyUpdate({ set: { applicationId: sql`${cityGovernorReferralConversions.applicationId}` } });
          referralMatched = true;
        }
      }
    });
  } catch (error) {
    if (isDuplicateEntry(error)) return { status: "already-participated" as const, recordDate };
    throw error;
  }
  return { status: "recorded" as const, recordDate, cityCode: participationCityForUser(profile.cityCode), referralMatched };
}

export async function addAnonymousDailyParticipation(input: { cityCode: string; voterFingerprint: string; referralCode?: string }) {
  if (!CITY_BY_CODE[input.cityCode as keyof typeof CITY_BY_CODE]) {
    throw new Error("Geçerli bir il seçmelisin.");
  }
  const db = await requireDb();
  const recordDate = getTurkeyDate();
  const existingVote = await db
    .select({ id: participations.id })
    .from(participations)
    .where(and(eq(participations.recordDate, recordDate), eq(participations.voterFingerprint, input.voterFingerprint)))
    .limit(1);
  if (existingVote.length > 0) return { status: "already-participated" as const, recordDate };
  let referralMatched = false;

  try {
    await db.transaction(async tx => {
      await tx.insert(participations).values({
        recordDate,
        cityCode: input.cityCode,
        voterFingerprint: input.voterFingerprint,
        points: 1,
      });
      await tx
        .insert(dailyCityScores)
        .values({ recordDate, cityCode: input.cityCode, totalPoints: 1 })
        .onDuplicateKeyUpdate({ set: { totalPoints: sql`${dailyCityScores.totalPoints} + 1` } });

      if (input.referralCode) {
        const application = await tx
          .select({ id: cityGovernorApplications.id, cityCode: cityGovernorApplications.cityCode })
          .from(cityGovernorApplications)
          .where(eq(cityGovernorApplications.referralCode, input.referralCode))
          .limit(1);
        const matchedApplication = application[0];
        if (matchedApplication && matchedApplication.cityCode === input.cityCode) {
          await tx
            .insert(cityGovernorReferralConversions)
            .values({ applicationId: matchedApplication.id, invitedFingerprint: input.voterFingerprint })
            .onDuplicateKeyUpdate({ set: { applicationId: sql`${cityGovernorReferralConversions.applicationId}` } });
          referralMatched = true;
        }
      }
    });
  } catch (error) {
    if (isDuplicateEntry(error)) return { status: "already-participated" as const, recordDate };
    throw error;
  }
  return { status: "recorded" as const, recordDate, cityCode: input.cityCode, referralMatched };
}

export async function getAnonymousDailyVoteStatus(voterFingerprint: string) {
  const db = await requireDb();
  const recordDate = getTurkeyDate();
  const existingVote = await db
    .select({ id: participations.id })
    .from(participations)
    .where(and(eq(participations.recordDate, recordDate), eq(participations.voterFingerprint, voterFingerprint)))
    .limit(1);
  return { recordDate, hasParticipated: existingVote.length > 0 };
}

export async function getHallOfFame() {
  const db = await requireDb();
  return db
    .select({
      recordDate: dailyArchives.recordDate,
      cityCode: dailyArchives.cityCode,
      totalPoints: dailyArchives.totalPoints,
      cityRank: dailyArchives.cityRank,
    })
    .from(dailyArchives)
    .orderBy(desc(dailyArchives.recordDate), asc(dailyArchives.cityRank))
    .limit(30);
}

async function getAdminHallOfFame() {
  const db = await requireDb();
  return db
    .select({
      recordDate: dailyArchives.recordDate,
      cityCode: dailyArchives.cityCode,
      totalPoints: dailyArchives.totalPoints,
      cityRank: dailyArchives.cityRank,
      cityLeaderName: dailyArchives.cityLeaderName,
      cityLeaderPoints: dailyArchives.cityLeaderPoints,
    })
    .from(dailyArchives)
    .orderBy(desc(dailyArchives.recordDate), asc(dailyArchives.cityRank))
    .limit(30);
}

export async function getAdminOverview() {
  const db = await requireDb();
  const recordDate = getTurkeyDate();
  const [leaderboard, participationCountRows, registeredUserRows, representedUserRows, recentParticipations, hallOfFame, jobs] = await Promise.all([
    getDailyLeaderboardWithLeaders(recordDate),
    db
      .select({ total: sql<number>`count(*)` })
      .from(participations)
      .where(eq(participations.recordDate, recordDate)),
    db.select({ total: sql<number>`count(*)` }).from(users),
    db.select({ total: sql<number>`count(*)` }).from(userProfiles),
    db
      .select({
        id: participations.id,
        cityCode: participations.cityCode,
        createdAt: participations.createdAt,
        userName: users.name,
      })
      .from(participations)
      .leftJoin(users, eq(participations.userId, users.id))
      .where(eq(participations.recordDate, recordDate))
      .orderBy(desc(participations.createdAt))
      .limit(8),
    getAdminHallOfFame(),
    db
      .select({
        jobKey: systemJobs.jobKey,
        lastProcessedDate: systemJobs.lastProcessedDate,
        updatedAt: systemJobs.updatedAt,
      })
      .from(systemJobs)
      .where(eq(systemJobs.jobKey, DAILY_ROLLOVER_JOB_KEY))
      .limit(1),
  ]);

  return {
    recordDate,
    metrics: {
      dailyParticipations: Number(participationCountRows[0]?.total ?? 0),
      registeredUsers: Number(registeredUserRows[0]?.total ?? 0),
      representedUsers: Number(representedUserRows[0]?.total ?? 0),
      activeCities: leaderboard.filter(city => city.totalPoints > 0).length,
    },
    leaderboard: leaderboard.slice(0, 10),
    recentParticipations: recentParticipations.map(item => ({
      ...item,
      userName: item.userName?.trim() || "Anonim temsilci",
    })),
    hallOfFame,
    rollover: {
      configured: jobs.length > 0,
      lastProcessedDate: jobs[0]?.lastProcessedDate ?? null,
      updatedAt: jobs[0]?.updatedAt ?? null,
    },
  };
}

export async function getAdminUsers() {
  const db = await requireDb();
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      loginMethod: users.loginMethod,
      role: users.role,
      createdAt: users.createdAt,
      lastSignedIn: users.lastSignedIn,
      cityCode: userProfiles.cityCode,
      selectedAt: userProfiles.selectedAt,
    })
    .from(users)
    .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
    .orderBy(desc(users.createdAt));

  return rows.map(user => ({
    ...user,
    name: user.name?.trim() || "İsimsiz kullanıcı",
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? "Bilinmiyor",
    cityCode: user.cityCode ?? null,
    selectedAt: user.selectedAt ?? null,
  }));
}

export async function archivePreviousTurkeyDay(now: Date = new Date()) {
  const db = await requireDb();
  const recordDate = getPreviousTurkeyDate(now);
  const existingArchive = await db
    .select({ id: dailyArchives.id })
    .from(dailyArchives)
    .where(eq(dailyArchives.recordDate, recordDate))
    .limit(1);
  if (existingArchive.length > 0) return { archived: false, recordDate, reason: "already-archived" as const };

  const leaderboard = await getDailyLeaderboardWithLeaders(recordDate);
  const archiveRows = leaderboard.map(city => ({
    recordDate,
    cityCode: city.cityCode,
    totalPoints: city.totalPoints,
    cityRank: city.rank,
    cityLeaderUserId: city.leader?.userId ?? null,
    cityLeaderName: city.leader?.name ?? "Katılım olmadı",
    cityLeaderPoints: city.leader?.points ?? 0,
  }));
  try {
    await db.insert(dailyArchives).values(archiveRows);
  } catch (error) {
    if (isDuplicateEntry(error)) return { archived: false, recordDate, reason: "already-archived" as const };
    throw error;
  }
  await db
    .insert(systemJobs)
    .values({ jobKey: DAILY_ROLLOVER_JOB_KEY, lastProcessedDate: recordDate })
    .onDuplicateKeyUpdate({ set: { lastProcessedDate: recordDate } });
  return { archived: true, recordDate, archivedCities: archiveRows.length };
}

export async function getSystemJobByTaskUid(taskUid: string) {
  const db = await requireDb();
  const rows = await db
    .select()
    .from(systemJobs)
    .where(eq(systemJobs.scheduleCronTaskUid, taskUid))
    .limit(1);
  return rows[0] ?? null;
}
