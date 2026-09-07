import { sql } from "drizzle-orm";
import { createDb, closeDb, getDatabaseUrl } from "./client";
import * as schema from "./schema";

const STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_he BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_en BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_es BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS product_translations (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      lang VARCHAR(5) NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      UNIQUE (product_id, lang)
    )`,
  `CREATE TABLE IF NOT EXISTS product_media (
      id SERIAL PRIMARY KEY,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      kind VARCHAR(32) NOT NULL,
      url TEXT NOT NULL,
      alt TEXT NOT NULL DEFAULT '',
      label TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0
    )`,
  `CREATE TABLE IF NOT EXISTS solutions (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL UNIQUE,
      practice_group VARCHAR(64) NOT NULL DEFAULT 'power-meters',
      sort_order INTEGER NOT NULL DEFAULT 0,
      hero_image_url TEXT NOT NULL DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_he BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_en BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_es BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS solution_translations (
      id SERIAL PRIMARY KEY,
      solution_id INTEGER NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
      lang VARCHAR(5) NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      lead TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      UNIQUE (solution_id, lang)
    )`,
  `CREATE TABLE IF NOT EXISTS product_solutions (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      solution_id INTEGER NOT NULL REFERENCES solutions(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (product_id, solution_id)
    )`,
  `CREATE TABLE IF NOT EXISTS industries (
      id SERIAL PRIMARY KEY,
      slug VARCHAR(120) NOT NULL UNIQUE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      hero_image_url TEXT NOT NULL DEFAULT '',
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_he BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_en BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_es BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS industry_translations (
      id SERIAL PRIMARY KEY,
      industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
      lang VARCHAR(5) NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      offer TEXT NOT NULL DEFAULT '',
      clients JSONB NOT NULL DEFAULT '[]'::jsonb,
      UNIQUE (industry_id, lang)
    )`,
  `CREATE TABLE IF NOT EXISTS product_industries (
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      industry_id INTEGER NOT NULL REFERENCES industries(id) ON DELETE CASCADE,
      PRIMARY KEY (product_id, industry_id)
    )`,
  `CREATE TABLE IF NOT EXISTS pages (
      id SERIAL PRIMARY KEY,
      key VARCHAR(64) NOT NULL UNIQUE,
      enabled BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_he BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_en BOOLEAN NOT NULL DEFAULT TRUE,
      enabled_es BOOLEAN NOT NULL DEFAULT TRUE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`,
  `CREATE TABLE IF NOT EXISTS page_translations (
      id SERIAL PRIMARY KEY,
      page_id INTEGER NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
      lang VARCHAR(5) NOT NULL,
      title TEXT NOT NULL DEFAULT '',
      body TEXT NOT NULL DEFAULT '',
      UNIQUE (page_id, lang)
    )`,
  `CREATE TABLE IF NOT EXISTS settings (
      id SERIAL PRIMARY KEY,
      key VARCHAR(120) NOT NULL UNIQUE,
      value TEXT NOT NULL DEFAULT ''
    )`,
];

/** Apply schema via CREATE IF NOT EXISTS for local/PGlite and Postgres. */
export async function migrate() {
  const db = await createDb();
  const mode = getDatabaseUrl() ? "postgres" : "pglite";
  console.log(`Migrating schema (${mode})…`);

  for (const statement of STATEMENTS) {
    await db.execute(sql.raw(statement));
  }

  void schema.products;
  console.log("Schema ready.");
}

const isMain = process.argv[1]?.includes("migrate");
if (isMain) {
  migrate()
    .then(() => closeDb())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
