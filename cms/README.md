# DDC CMS admin + content snapshot (Firebase / control-applications-ddc)

- **Admin** — https://control-applications-admin.web.app (edit products / solutions / industries)
- **Public site (same UI as marketing)** — https://control-applications-cms.web.app

The public CMS URL is the **real static site** (same layout, CSS, images as https://control-applications-ddc.web.app). On build, `scripts/build_site.py` overlays content from `cms/data/public.json` when that file exists. After load, `assets/js/cms-live.js` refreshes CMS fields from the live snapshot at `/cms/public.json`.

## How persistence works

1. Admin edits are stored in-memory (PGlite) on the Cloud Function for the warm instance.
2. Every save **publishes** a full snapshot to **Firestore** (`cms/public`) — durable across cold starts.
3. Public pages load `/cms/public.json` (Hosting rewrite → admin function → Firestore).
4. `cms-live.js` applies titles, bodies, offers, and contact details on top of the static HTML.

## Local

```bash
cd cms && npm install && npm run db:seed && npm run admin:dev
# then from repo root:
python3 scripts/build_site.py
```

## Deploy public site (exact UI)

```bash
python3 scripts/build_site.py
firebase deploy --only hosting:ddc-cms,firestore --project control-applications-ddc
# optional: also update marketing
firebase deploy --only hosting:ddc-temp --project control-applications-ddc
```

## Deploy admin

```bash
./scripts/stage_cms_for_firebase.sh
firebase experiments:enable webframeworks
firebase deploy --only hosting:ddc-admin,firestore --project control-applications-ddc --force
```

Login: invite Google accounts in Members. Set `ADMIN_OWNER_EMAIL` plus `NEXT_PUBLIC_FIREBASE_API_KEY`, `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`, `NEXT_PUBLIC_FIREBASE_PROJECT_ID`, and `NEXT_PUBLIC_FIREBASE_APP_ID` in `cms/.env`. The owner email can sign in before anyone else is invited. `SESSION_SECRET` signs the session cookie.
