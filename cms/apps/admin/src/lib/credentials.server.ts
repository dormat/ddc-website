/** Local/dev defaults — overwritten by stage_cms_for_firebase.sh for deploy. */
export const username = process.env.ADMIN_USERNAME || "AdminDDC";
export const password = process.env.ADMIN_PASSWORD || "6474998";
export const sessionSecret =
  process.env.SESSION_SECRET || "ddc-session-secret-change-in-prod-2026";
export const ownerEmail = process.env.ADMIN_OWNER_EMAIL || "";
