import { eq, isNull, asc } from "drizzle-orm";
import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { folders } from "~/server/db/schema";
import { env } from "~/env";

export const folderRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(
      z.object({
        parentId: z.number().nullable().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      if (input?.parentId === null || input?.parentId === undefined) {
        return ctx.db
          .select()
          .from(folders)
          .where(isNull(folders.parentId))
          .orderBy(asc(folders.name));
      }
      return ctx.db
        .select()
        .from(folders)
        .where(eq(folders.parentId, input.parentId))
        .orderBy(asc(folders.name));
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const folder = await ctx.db
        .select()
        .from(folders)
        .where(eq(folders.id, input.id))
        .limit(1);
      return folder[0] ?? null;
    }),

  getBreadcrumbs: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const breadcrumbs: { id: number; name: string }[] = [];
      let currentId: number | null = input.id;

      while (currentId !== null) {
        const folder = await ctx.db
          .select()
          .from(folders)
          .where(eq(folders.id, currentId))
          .limit(1);

        if (!folder[0]) break;
        breadcrumbs.unshift({ id: folder[0].id, name: folder[0].name });
        currentId = folder[0].parentId;
      }

      return breadcrumbs;
    }),

  create: publicProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        parentId: z.number().nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let s3Path = input.name;

      if (input.parentId) {
        const parent = await ctx.db
          .select()
          .from(folders)
          .where(eq(folders.id, input.parentId))
          .limit(1);

        if (parent[0]) {
          s3Path = `${parent[0].s3Path}/${input.name}`;
        }
      }

      const result = await ctx.db
        .insert(folders)
        .values({
          name: input.name,
          parentId: input.parentId ?? null,
          s3Path,
        })
        .returning();

      return result[0];
    }),

  rename: publicProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db
        .update(folders)
        .set({ name: input.name })
        .where(eq(folders.id, input.id))
        .returning();
      return result[0];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(folders).where(eq(folders.id, input.id));
      return { success: true };
    }),

  getTree: publicProcedure.query(async ({ ctx }) => {
    const allFolders = await ctx.db
      .select()
      .from(folders)
      .orderBy(asc(folders.name));
    return allFolders;
  }),
});
