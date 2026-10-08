import type { PublicSnapshot } from "@ddc/db";
import { firestore } from "@/lib/firebase";

const DOC_PATH = process.env.CMS_SNAPSHOT_DOC?.trim() || "cms/public";

function db() {
  return firestore();
}

/** Load durable CMS snapshot from Firestore (null if missing / unavailable). */
export async function loadRemoteSnapshot(): Promise<PublicSnapshot | null> {
  try {
    const snap = await db().doc(DOC_PATH).get();
    if (!snap.exists) return null;
    const data = snap.data() as PublicSnapshot | undefined;
    if (!data || typeof data !== "object" || !Array.isArray(data.products)) return null;
    return data;
  } catch (err) {
    console.warn("loadRemoteSnapshot failed", err);
    return null;
  }
}

/** Persist CMS snapshot to Firestore (source of truth across cold starts). */
export async function saveRemoteSnapshot(snapshot: PublicSnapshot): Promise<void> {
  await db().doc(DOC_PATH).set({
    ...snapshot,
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
  });
}
