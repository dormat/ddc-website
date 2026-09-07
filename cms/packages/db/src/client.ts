import fs from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePg } from "drizzle-orm/postgres-js";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import postgres from "postgres";
import * as schema from "./schema";

/** Walk up from cwd until we find the cms workspace root (has packages/db). */
export function resolveCmsRoot(): string {
  if (process.env.CMS_ROOT?.trim()) {
    return path.resolve(process.env.CMS_ROOT.trim());
  }
  // Firebase-staged app keeps data/public.json next to package.json
  if (fs.existsSync(path.join(process.cwd(), "data", "public.json"))) {
    return process.cwd();
  }
  let dir = process.cwd();
  for (let i = 0; i < 8; i++) {
    if (fs.existsSync(path.join(dir, "packages", "db", "package.json"))) {
      return dir;
    }
    if (fs.existsSync(path.join(dir, "data", "public.json"))) {
      return dir;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return path.resolve(process.cwd(), "../..");
}

const CMS_ROOT = resolveCmsRoot();
loadEnv({ path: path.join(CMS_ROOT, ".env") });
loadEnv({ path: path.join(process.cwd(), ".env") });

const PGLITE_DIR =
  process.env.PGLITE_DIR?.trim() ||
  (process.env.K_SERVICE || process.env.FUNCTION_TARGET
    ? path.join("/tmp", "ddc-pglite")
    : path.join(CMS_ROOT, "data", "pglite"));

export type Db = ReturnType<typeof drizzlePg<typeof schema>> | ReturnType<typeof drizzlePglite<typeof schema>>;

type GlobalDb = {
  __ddcDb?: Db;
  __ddcSql?: ReturnType<typeof postgres> | PGlite;
};

const g = globalThis as unknown as GlobalDb;

export function getDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL?.trim() || undefined;
}

export async function createDb(): Promise<Db> {
  if (g.__ddcDb) return g.__ddcDb;

  const url = getDatabaseUrl();
  if (url) {
    const sql = postgres(url, { max: 5 });
    g.__ddcSql = sql;
    g.__ddcDb = drizzlePg(sql, { schema });
    return g.__ddcDb;
  }

  fs.mkdirSync(PGLITE_DIR, { recursive: true });
  const client = new PGlite(PGLITE_DIR);
  g.__ddcSql = client;
  g.__ddcDb = drizzlePglite(client, { schema });
  return g.__ddcDb;
}

export async function closeDb(): Promise<void> {
  const sql = g.__ddcSql;
  if (sql && "end" in sql && typeof sql.end === "function") {
    await sql.end({ timeout: 5 });
  }
  if (sql && "close" in sql && typeof (sql as PGlite).close === "function") {
    await (sql as PGlite).close();
  }
  g.__ddcDb = undefined;
  g.__ddcSql = undefined;
}

export { schema };
export * from "./schema";
