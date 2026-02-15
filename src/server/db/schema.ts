import { relations } from "drizzle-orm";
import { index, pgTableCreator } from "drizzle-orm/pg-core";

export const createTable = pgTableCreator((name) => `varit_${name}`);

export const folders = createTable(
  "folder",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 255 }).notNull(),
    parentId: d.integer(),
    s3Path: d.varchar({ length: 1024 }).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    index("folder_parent_idx").on(t.parentId),
    index("folder_name_idx").on(t.name),
  ]
);

export const foldersRelations = relations(folders, ({ one, many }) => ({
  parent: one(folders, {
    fields: [folders.parentId],
    references: [folders.id],
    relationName: "parentChild",
  }),
  children: many(folders, { relationName: "parentChild" }),
  mediaItems: many(mediaItems),
}));

export const mediaItems = createTable(
  "media_item",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    fileName: d.varchar({ length: 512 }).notNull(),
    originalName: d.varchar({ length: 512 }).notNull(),
    mimeType: d.varchar({ length: 128 }).notNull(),
    fileSize: d.integer().notNull(),
    s3Key: d.varchar({ length: 1024 }).notNull(),
    s3Url: d.varchar({ length: 2048 }).notNull(),
    folderId: d.integer().references(() => folders.id, { onDelete: "set null" }),
    note: d.text(),
    sendDate: d.date({ mode: "string" }),
    sent: d.boolean().default(false).notNull(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("media_folder_idx").on(t.folderId),
    index("media_send_date_idx").on(t.sendDate),
    index("media_sent_idx").on(t.sent),
    index("media_created_idx").on(t.createdAt),
  ]
);

export const studyCards = createTable(
  "study_card",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    title: d.varchar({ length: 255 }).notNull(),
    description: d.text().notNull(),
    youtubeUrl: d.varchar({ length: 1024 }),
    imageUrl: d.varchar({ length: 2048 }),
    imageS3Key: d.varchar({ length: 1024 }),
    attachments: d.text(),
    category: d.varchar({ length: 100 }),
    difficulty: d.varchar({ length: 20 }).default("medium"),
    tags: d.text(),
    isCompleted: d.boolean().default(false).notNull(),
    rating: d.integer().default(0),
    notes: d.text(),
    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("study_card_category_idx").on(t.category),
    index("study_card_difficulty_idx").on(t.difficulty),
    index("study_card_completed_idx").on(t.isCompleted),
    index("study_card_created_idx").on(t.createdAt),
    index("study_card_rating_idx").on(t.rating),
  ]
);
