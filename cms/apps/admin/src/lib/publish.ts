import { exportPublicSnapshot } from "@ddc/db";

/** After admin writes: refresh public.json and ping the public site to drop cache. */
export async function publishToPublicSite() {
  try {
    await exportPublicSnapshot();
  } catch (err) {
    console.error("Failed to export public snapshot", err);
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
    console.error("Failed to notify public revalidate", err);
  }
}
