import { TRPCError } from "@trpc/server";
import { createHmac } from "node:crypto";
import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "./_core/trpc";
import * as db from "./db";
import { storageGetSignedUrl } from "./storage";
import { ENV } from "./_core/env";
import type { TrpcContext } from "./_core/context";

function gameError(error: unknown): TRPCError {
  if (error instanceof TRPCError) return error;
  const safeMessages = new Set([
    "Geçerli bir il seçmelisin.",
    "Puan vermeden önce temsil edeceğin ili seçmelisin.",
  ]);
  const message = error instanceof Error && safeMessages.has(error.message)
    ? error.message
    : "Oyun şu anda kaydedilemedi. Lütfen tekrar dene.";
  return new TRPCError({ code: "BAD_REQUEST", message });
}

function getAnonymousVoterFingerprint(req: TrpcContext["req"]) {
  const clientIp = (req.ip ?? req.socket.remoteAddress ?? "").replace(/^::ffff:/, "").trim();
  if (!clientIp) throw new TRPCError({ code: "BAD_REQUEST", message: "Oy adresi doğrulanamadı. Lütfen tekrar dene." });
  return createHmac("sha256", ENV.cookieSecret || ENV.appId || "sehrim-lol-local").update(clientIp).digest("hex");
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  site: router({
    pulse: publicProcedure.query(() => db.getSitePulse()),
    trackVisit: publicProcedure
      .input(z.object({ sessionId: z.string().trim().min(16).max(96) }))
      .mutation(({ input }) => db.trackSiteVisit(input.sessionId)),
    heartbeat: publicProcedure
      .input(z.object({ sessionId: z.string().trim().min(16).max(96) }))
      .mutation(({ input }) => db.heartbeatOnlineSession(input.sessionId)),
  }),
  game: router({
    dashboard: publicProcedure.query(({ ctx }) => db.getDailyDashboard(ctx.user?.id)),
    anonymousVoteStatus: publicProcedure.query(({ ctx }) => db.getAnonymousDailyVoteStatus(getAnonymousVoterFingerprint(ctx.req))),
    hallOfFame: publicProcedure.query(() => db.getHallOfFame()),
    allTimeLeaderboard: publicProcedure.query(async () => {
      const result = await db.getAllTimeLeaderboard();
      return {
        totalVotes: result.totalVotes,
        leaderboard: result.leaderboard.map(({ cityCode, cityName, totalPoints, rank, percentage }) => ({
          cityCode,
          cityName,
          totalPoints,
          rank,
          percentage,
        })),
      };
    }),
    selectCity: protectedProcedure
      .input(z.object({ cityCode: z.string().regex(/^([0-7][0-9]|8[01]|0[1-9])$/) }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.setRepresentativeCity(ctx.user.id, input.cityCode);
        } catch (error) {
          throw gameError(error);
        }
      }),
    participate: publicProcedure.input(z.object({ cityCode: z.string().regex(/^([0-7][0-9]|8[01]|0[1-9])$/), referralCode: z.string().regex(/^gv_[A-Za-z0-9_-]{16,60}$/).optional() })).mutation(async ({ ctx, input }) => {
      try {
        return await db.addAnonymousDailyParticipation({ ...input, voterFingerprint: getAnonymousVoterFingerprint(ctx.req) });
      } catch (error) {
        throw gameError(error);
      }
      }),
  }),
  cityGovernorApplications: router({
    submit: protectedProcedure
      .input(z.object({
        cityCode: z.string().regex(/^([0-7][0-9]|8[01]|0[1-9])$/),
        brandName: z.string().trim().min(2).max(160),
        contactEmail: z.string().trim().email().max(320),
        website: z.string().trim().url().max(2048),
        message: z.string().trim().min(20).max(2000),
        attachment: z.object({
          fileName: z.string().trim().min(1).max(180),
          contentType: z.enum(["image/png", "image/jpeg", "image/webp", "application/pdf"]),
          dataBase64: z.string().min(4).max(4_200_000).regex(/^[A-Za-z0-9+/]+={0,2}$/),
        }).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.submitCityGovernorApplication(ctx.user.id, input);
        } catch (error) {
          throw gameError(error);
        }
      }),
    approvedSponsors: publicProcedure.query(async () => {
      const sponsors = await db.getApprovedCityGovernorSponsors();
      return sponsors.map(({ cityCode, brandName, website, message, logoUrl }) => ({
        cityCode,
        brandName,
        website,
        message,
        ...(logoUrl ? { logoUrl } : {}),
      }));
    }),
    formerSponsors: publicProcedure.query(async () => {
      const sponsors = await db.getFormerCityGovernorHistory();
      return sponsors.map(({ cityCode, brandName, website, message, changeType, archivedAt, logoUrl }) => ({
        cityCode,
        brandName,
        website,
        message,
        changeType,
        archivedAt,
        ...(logoUrl ? { logoUrl } : {}),
      }));
    }),
    myReferralProgress: protectedProcedure
      .input(z.object({ cityCode: z.string().regex(/^([0-7][0-9]|8[01]|0[1-9])$/) }))
      .query(({ ctx, input }) => db.getMyCityGovernorReferralProgress(ctx.user.id, input.cityCode)),
    mine: protectedProcedure.query(({ ctx }) => db.getMyCityGovernorApplications(ctx.user.id)),
    attachmentUrl: protectedProcedure
      .input(z.object({ applicationId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        const attachment = await db.getCityGovernorApplicationAttachment(input.applicationId);
        if (!attachment?.attachmentKey || !attachment.attachmentName) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Bu başvuruya ait dosya bulunamadı." });
        }
        if (ctx.user.role !== "admin" && attachment.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Bu dosyayı görüntüleme yetkin yok." });
        }
        return {
          fileName: attachment.attachmentName,
          contentType: attachment.attachmentContentType,
          url: await storageGetSignedUrl(attachment.attachmentKey),
        };
      }),
  }),
  admin: router({
    overview: adminProcedure.query(() => db.getAdminOverview()),
    users: adminProcedure.query(() => db.getAdminUsers()),
    cityGovernorApplications: adminProcedure.query(() => db.getAdminCityGovernorApplications()),
    cityGovernorReferralPerformance: adminProcedure.query(() => db.getAdminCityGovernorReferralPerformance()),
    reviewCityGovernorApplication: adminProcedure
      .input(z.object({
        applicationId: z.number().int().positive(),
        status: z.enum(["approved", "rejected"]),
        decisionNote: z.string().trim().max(1000).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.reviewCityGovernorApplication(
            input.applicationId,
            ctx.user.id,
            input.status,
            input.decisionNote?.trim() || null,
          );
        } catch (error) {
          throw gameError(error);
        }
      }),
    removeApprovedCityGovernorApplication: adminProcedure
      .input(z.object({ applicationId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await db.removeApprovedCityGovernorApplication(input.applicationId, ctx.user.id);
        } catch (error) {
          throw gameError(error);
        }
      }),
    reopenRemovedCityGovernorApplication: adminProcedure
      .input(z.object({ applicationId: z.number().int().positive() }))
      .mutation(async ({ input }) => {
        try {
          return await db.reopenRemovedCityGovernorApplication(input.applicationId);
        } catch (error) {
          throw gameError(error);
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
