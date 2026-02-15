import { eq, desc, and, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { mediaItems, folders } from "~/server/db/schema";
import { generateUploadUrl, getS3Key, getPublicUrl, deleteS3Object } from "~/server/s3";

export const mediaRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        folderId: z.number().nullable().optional(),
        sent: z.boolean().optional(),
        sendDate: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const conditions = [];

      if (input.folderId !== undefined) {
        if (input.folderId === null) {
          conditions.push(isNull(mediaItems.folderId));
        } else {
          conditions.push(eq(mediaItems.folderId, input.folderId));
        }
      }

      if (input.sent !== undefined) {
        conditions.push(eq(mediaItems.sent, input.sent));
      }

      if (input.sendDate) {
        conditions.push(eq(mediaItems.sendDate, input.sendDate));
      }

      if (input.cursor) {
        conditions.push(sql`${mediaItems.id} < ${input.cursor}`);
      }

      const items = await ctx.db
        .select()
        .from(mediaItems)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(mediaItems.createdAt))
        .limit(input.limit + 1);

      let nextCursor: number | undefined;
      if (items.length > input.limit) {
        const nextItem = items.pop();
        nextCursor = nextItem?.id;
      }

      return { items, nextCursor };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const item = await ctx.db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.id, input.id))
        .limit(1);
      return item[0] ?? null;
    }),

  getUploadUrl: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        contentType: z.string(),
        folderPath: z.string().default(""),
      })
    )
    .mutation(async ({ input }) => {
      const timestamp = Date.now();
      const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
      const uniqueName = `${timestamp}_${safeName}`;
      const s3Key = getS3Key(input.folderPath, uniqueName);
      const uploadUrl = await generateUploadUrl(s3Key, input.contentType);
      const publicUrl = getPublicUrl(s3Key);

      return { uploadUrl, s3Key, publicUrl, fileName: uniqueName };
    }),

  create: publicProcedure
    .input(
      z.object({
        fileName: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        fileSize: z.number(),
        s3Key: z.string(),
        s3Url: z.string(),
        folderId: z.number().nullable().optional(),
        note: z.string().optional(),
        sendDate: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .insert(mediaItems)
        .values({
          fileName: input.fileName,
          originalName: input.originalName,
          mimeType: input.mimeType,
          fileSize: input.fileSize,
          s3Key: input.s3Key,
          s3Url: input.s3Url,
          folderId: input.folderId ?? null,
          note: input.note ?? null,
          sendDate: input.sendDate ?? null,
        })
        .returning();
      return result[0];
    }),

  update: publicProcedure
    .input(
      z.object({
        id: z.number(),
        note: z.string().optional(),
        sendDate: z.string().nullable().optional(),
        sent: z.boolean().optional(),
        folderId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input;
      const result = await ctx.db
        .update(mediaItems)
        .set(updates)
        .where(eq(mediaItems.id, id))
        .returning();
      return result[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const item = await ctx.db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.id, input.id))
        .limit(1);

      if (item[0]) {
        await deleteS3Object(item[0].s3Key);
        await ctx.db.delete(mediaItems).where(eq(mediaItems.id, input.id));
      }

      return { success: true };
    }),

  markSent: publicProcedure
    .input(z.object({ ids: z.array(z.number()) }))
    .mutation(async ({ ctx, input }) => {
      for (const id of input.ids) {
        await ctx.db
          .update(mediaItems)
          .set({ sent: true })
          .where(eq(mediaItems.id, id));
      }
      return { success: true };
    }),

  getStats: publicProcedure.query(async ({ ctx }) => {
    const totalResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(mediaItems);
    const sentResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(mediaItems)
      .where(eq(mediaItems.sent, true));
    const pendingResult = await ctx.db
      .select({ count: sql<number>`count(*)` })
      .from(mediaItems)
      .where(eq(mediaItems.sent, false));

    return {
      total: Number(totalResult[0]?.count ?? 0),
      sent: Number(sentResult[0]?.count ?? 0),
      pending: Number(pendingResult[0]?.count ?? 0),
    };
  }),

  getByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      const items = await ctx.db
        .select()
        .from(mediaItems)
        .where(eq(mediaItems.sendDate, input.date))
        .orderBy(desc(mediaItems.createdAt));
      return items;
    }),

  assignToDate: publicProcedure
    .input(
      z.object({
        ids: z.array(z.number()),
        sendDate: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      for (const id of input.ids) {
        await ctx.db
          .update(mediaItems)
          .set({ sendDate: input.sendDate })
          .where(eq(mediaItems.id, id));
      }
      return { success: true };
    }),
});
