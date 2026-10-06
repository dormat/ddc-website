import { buildPublicSnapshot, exportPublicSnapshot } from "@ddc/db";
import { saveRemoteSnapshot } from "@/lib/snapshot-store";

/** After admin writes: persist snapshot locally + Firestore (durable). */
export async function publishToPublicSite() {
  try {
    await exportPublicSnapshot();
    const snapshot = await buildPublicSnapshot();
    await saveRemoteSnapshot(snapshot);
  } catch (err) {
    console.error("Failed to publish CMS snapshot", err);
    throw err;
  }

  const url = process.env.PUBLIC_REVALIDATE_URL?.trim();
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!url || !secret) return;

  try {
    await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-revalidate-secret": secret,
      },
      body: JSON.stringify({ tags: ["cms"] }),
    });
  } catch (err) {
    // Optional Next revalidate target — ignore if unset or unreachable.
    console.warn("Failed to notify public revalidate", err);
  }
}
