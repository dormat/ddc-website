import { getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** Must match the Firebase ID token audience from the web app. */
const PROJECT_ID = "control-applications-ddc";

export function ensureFirebaseApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({ projectId: PROJECT_ID });
}

export function firestore() {
  return getFirestore(ensureFirebaseApp());
}
