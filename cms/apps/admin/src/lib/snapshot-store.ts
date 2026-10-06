import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import type { PublicSnapshot } from "@ddc/db";

const DOC_PATH = process.env.CMS_SNAPSHOT_DOC?.trim() || "cms/public";

function ensureFirebaseApp() {
  if (getApps().length) return;
  // Cloud Functions / Cloud Run: ADC + FIREBASE_CONFIG
  initializeApp();
}

function db() {
  ensureFirebaseApp();
  return getFirestore();
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
  ensureFirebaseApp();
  await db().doc(DOC_PATH).set({
    ...snapshot,
    updatedAt: snapshot.updatedAt || new Date().toISOString(),
  });
}
