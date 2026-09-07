# DDC CMS + public site (Firebase / harokdim)

Postgres-backed content (or local PGlite) with:

- **Public CMS site** — https://ddc-cms.web.app  
- **Admin** — https://ddc-admin.web.app (separate Hosting site; not linked from the marketing site)

The classic static marketing site remains on https://ddc-temp.web.app (branch `main`).

## Local quick start

```bash
cd cms
cp .env.example .env
npm install
npm run db:seed
npm run web:dev      # http://127.0.0.1:3000
npm run admin:dev    # http://127.0.0.1:3010
```

Production login is configured in the Firebase function env (see deploy). Local defaults are in `.env` (gitignored).

## Deploy to Firebase (harokdim)

```bash
# from repo root
./scripts/stage_cms_for_firebase.sh
export XDG_CONFIG_HOME="$PWD/.firebase-xdg"   # optional if firebase config is restricted
firebase experiments:enable webframeworks
firebase deploy --only hosting:ddc-cms,hosting:ddc-admin --project harokdim --force
```

Sites:

| Target | URL |
|--------|-----|
| `ddc-cms` | https://ddc-cms.web.app |
| `ddc-admin` | https://ddc-admin.web.app |
| `ddc-temp` | https://ddc-temp.web.app (static marketing / `main`) |

## How content flows

1. Admin edits → DB (PGlite locally / Postgres if `DATABASE_URL` is set)
2. Save exports `cms/data/public.json` and revalidates the public site cache
3. Public site reads the snapshot (hard-cached)

## What you can edit in admin

- Products, solutions, industries, pages, settings
- Global + he/en/es enable flags
