import {
  createDb,
  closeDb,
  importPublicSnapshot,
  migrate,
  products,
  readPublicSnapshotFile,
  type PublicSnapshot,
} from "@ddc/db";
import { count } from "@ddc/db";
import bundledSnapshot from "@/data/public.json";
import { loadRemoteSnapshot, saveRemoteSnapshot } from "@/lib/snapshot-store";
import { normalizeSnapshotPages, pickNewestSnapshot } from "@/lib/snapshot-normalize";

let ready: Promise<void> | null = null;
let loadedUpdatedAt: string | null = null;

async function resolveSnapshot(): Promise<{ snap: PublicSnapshot; persist: boolean }> {
  const remote = await loadRemoteSnapshot();
  const disk = readPublicSnapshotFile();
  const bundled = bundledSnapshot as PublicSnapshot;
  const newest = pickNewestSnapshot(remote, disk, bundled) || bundled;
  const { snap, changed } = normalizeSnapshotPages(newest);
  const persist =
    changed || !remote || (snap.updatedAt || "") !== (remote.updatedAt || "");
  return { snap, persist };
}

async function bootstrapFromSnapshot(snap: PublicSnapshot, persist: boolean) {
  await closeDb();
  await migrate();
  await importPublicSnapshot(snap);
  loadedUpdatedAt = snap.updatedAt || null;

  if (persist) {
    try {
      await saveRemoteSnapshot(snap);
    } catch (err) {
      console.warn("Failed to persist CMS snapshot to Firestore", err);
    }
  }
}

async function ensureReady() {
  const { snap, persist } = await resolveSnapshot();

  if (loadedUpdatedAt && snap.updatedAt && loadedUpdatedAt === snap.updatedAt) {
    const db = await createDb();
    const [row] = await db.select({ n: count() }).from(products);
    if ((row?.n || 0) > 0) return;
  }

  await bootstrapFromSnapshot(snap, persist);

  const db = await createDb();
  const [row] = await db.select({ n: count() }).from(products);
  if ((row?.n || 0) === 0) {
    throw new Error("Admin DB bootstrap produced an empty products table");
  }
}

/** Shared DB handle. Reloads from Firestore when the durable snapshot changes. */
export async function getDb() {
  if (!ready) {
    ready = ensureReady().catch((err) => {
      ready = null;
      loadedUpdatedAt = null;
      console.error("Admin DB bootstrap failed", err);
      throw err;
    });
  }
  await ready;

  try {
    const remote = await loadRemoteSnapshot();
    if (remote?.updatedAt && loadedUpdatedAt && remote.updatedAt !== loadedUpdatedAt) {
      ready = null;
      return getDb();
    }
  } catch {
    // keep warm DB
  }

  return createDb();
}
