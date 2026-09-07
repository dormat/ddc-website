import {
  createDb,
  importPublicSnapshot,
  migrate,
  products,
  readPublicSnapshotFile,
} from "@ddc/db";
import { count } from "@ddc/db";

let ready: Promise<void> | null = null;

async function ensureReady() {
  await migrate();
  const db = await createDb();
  const [row] = await db.select({ n: count() }).from(products);
  if ((row?.n || 0) > 0) return;
  const snap = readPublicSnapshotFile();
  if (snap) {
    await importPublicSnapshot(snap);
  }
}

/** Shared DB handle. Bootstraps schema + snapshot on cold start when empty. */
export async function getDb() {
  if (!ready) ready = ensureReady().catch((err) => {
    ready = null;
    throw err;
  });
  await ready;
  return createDb();
}
