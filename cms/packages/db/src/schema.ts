import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  enabled: boolean("enabled").notNull().default(true),
  enabledHe: boolean("enabled_he").notNull().default(true),
  enabledEn: boolean("enabled_en").notNull().default(true),
  enabledEs: boolean("enabled_es").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const productTranslations = pgTable(
  "product_translations",
  {
    id: serial("id").primaryKey(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    lang: varchar("lang", { length: 5 }).notNull(),
    title: text("title").notNull().default(""),
    description: text("description").notNull().default(""),
    body: text("body").notNull().default(""),
  },
  (t) => [uniqueIndex("product_translations_product_lang").on(t.productId, t.lang)],
);

export const productMedia = pgTable("product_media", {
  id: serial("id").primaryKey(),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  kind: varchar("kind", { length: 32 }).notNull(), // hero | gallery | document | image
  url: text("url").notNull(),
  alt: text("alt").notNull().default(""),
  label: text("label").notNull().default(""),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const solutions = pgTable("solutions", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  practiceGroup: varchar("practice_group", { length: 64 }).notNull().default("power-meters"),
  sortOrder: integer("sort_order").notNull().default(0),
  heroImageUrl: text("hero_image_url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  enabledHe: boolean("enabled_he").notNull().default(true),
  enabledEn: boolean("enabled_en").notNull().default(true),
  enabledEs: boolean("enabled_es").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const solutionTranslations = pgTable(
  "solution_translations",
  {
    id: serial("id").primaryKey(),
    solutionId: integer("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
    lang: varchar("lang", { length: 5 }).notNull(),
    title: text("title").notNull().default(""),
    lead: text("lead").notNull().default(""),
    body: text("body").notNull().default(""),
  },
  (t) => [uniqueIndex("solution_translations_solution_lang").on(t.solutionId, t.lang)],
);

export const productSolutions = pgTable(
  "product_solutions",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    solutionId: integer("solution_id")
      .notNull()
      .references(() => solutions.id, { onDelete: "cascade" }),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.productId, t.solutionId] })],
);

export const industries = pgTable("industries", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 120 }).notNull().unique(),
  sortOrder: integer("sort_order").notNull().default(0),
  heroImageUrl: text("hero_image_url").notNull().default(""),
  enabled: boolean("enabled").notNull().default(true),
  enabledHe: boolean("enabled_he").notNull().default(true),
  enabledEn: boolean("enabled_en").notNull().default(true),
  enabledEs: boolean("enabled_es").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const industryTranslations = pgTable(
  "industry_translations",
  {
    id: serial("id").primaryKey(),
    industryId: integer("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
    lang: varchar("lang", { length: 5 }).notNull(),
    title: text("title").notNull().default(""),
    offer: text("offer").notNull().default(""),
    clients: jsonb("clients").$type<string[]>().notNull().default([]),
  },
  (t) => [uniqueIndex("industry_translations_industry_lang").on(t.industryId, t.lang)],
);

export const productIndustries = pgTable(
  "product_industries",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    industryId: integer("industry_id")
      .notNull()
      .references(() => industries.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.productId, t.industryId] })],
);

export const pages = pgTable("pages", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 64 }).notNull().unique(), // about | home | contact | industries
  enabled: boolean("enabled").notNull().default(true),
  enabledHe: boolean("enabled_he").notNull().default(true),
  enabledEn: boolean("enabled_en").notNull().default(true),
  enabledEs: boolean("enabled_es").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pageTranslations = pgTable(
  "page_translations",
  {
    id: serial("id").primaryKey(),
    pageId: integer("page_id")
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    lang: varchar("lang", { length: 5 }).notNull(),
    title: text("title").notNull().default(""),
    body: text("body").notNull().default(""),
  },
  (t) => [uniqueIndex("page_translations_page_lang").on(t.pageId, t.lang)],
);

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 120 }).notNull().unique(),
  value: text("value").notNull().default(""),
});
