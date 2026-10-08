import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

export function ensureFirebaseApp() {
  if (getApps().length) return;
  initializeApp();
}

export function firestore() {
  ensureFirebaseApp();
  return getFirestore();
}
