# DDC Website (ישומי בקרה / Control Applications)

Static trilingual site for DDC / Control Applications, deployable to Firebase Hosting.

## What's included

- **57 pages per language** — products, categories, projects, about, contact
- Trilingual navigation with dropdown menus
- RTL layout for Hebrew, LTR for English and Spanish
- Homepage carousel, contact footer with map

## Project structure

```
ddc-website/
├── site/              # Deployable static site (build output)
│   ├── he/            # Hebrew pages
│   ├── en/            # English pages
│   ├── es/            # Spanish pages
│   └── assets/        # CSS, JS, images
├── content/           # Page content (JSON, one file per page per language)
│   ├── he/
│   ├── en/
│   └── es/
├── cms/               # Separate admin CMS (Postgres/PGlite + Next.js) — see cms/README.md
├── scripts/
│   ├── build_site.py       # Generate HTML from content JSON
│   ├── config.py           # Navigation, projects, site config
│   ├── slugs.py            # Canonical page slug list
│   ├── build_image_aliases.py
│   ├── download_assets.py  # Verify local images exist
│   ├── image_assets.py
│   └── document_assets.py
├── assets/            # Source CSS/JS/images (copied to site/ on build)
└── firebase.json
```

## Admin CMS (separate host)

Content DB + admin UI live under `cms/` on a **different URL** from the public site (local default `http://127.0.0.1:3010`). The connected public Next site is `http://127.0.0.1:3000`. See [`cms/README.md`](cms/README.md).

```bash
cd cms && cp .env.example .env && npm install && npm run db:seed
npm run web:dev      # public site :3000 (reads CMS)
npm run admin:dev    # admin :3010 (edits → publish to site)
```

## Quick start

### 1. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 2. Build the static site

```bash
python scripts/build_site.py
```

### 3. Preview locally

```bash
cd site
python -m http.server 8080
```

- Hebrew: http://localhost:8080/he/
- English: http://localhost:8080/en/
- Spanish: http://localhost:8080/es/

## Deploy to Firebase Hosting

### Automatic deploy on push (recommended)

GitHub Actions workflows in `.github/workflows/` build the site and deploy to Firebase Hosting when you push to `main` (live) or open a pull request (preview URL).

**One-time setup** — run from the project root on a machine with Node.js installed:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting:github
```

When prompted:

- Firebase project: **harokdim**
- GitHub repo: **dormat/ddc-website**
- Live branch: **main**
- Build command: `pip install -r requirements.txt && python scripts/build_site.py` (or skip if workflows already exist)

The CLI creates a service account and uploads it to GitHub as the secret `FIREBASE_SERVICE_ACCOUNT_HAROKDIM`. If the workflow files already exist, choose **not** to overwrite them when asked.

After the secret is in place:

- Every push to `main` deploys to **ddc-temp** — https://ddc-temp.web.app
- Every push to `cursor/solutions-first-site-ee14` deploys to **ddc-temp2** — https://ddc-temp2.web.app (and https://ddc-temp2.firebaseapp.com)

The first solutions-first deploy creates the `ddc-temp2` Hosting site in the **harokdim** project if it does not already exist. `main` is unchanged and still goes only to `ddc-temp`.

### Manual deploy

```bash
npm install -g firebase-tools
firebase login
python scripts/build_site.py
firebase deploy
```

(`firebase.json` already points `public` at `site/`.)

## Maintaining content

| Change | Edit | Then |
|--------|------|------|
| Page copy | `content/he/<slug>.json` and `content/en/<slug>.json` | `python scripts/build_site.py` |
| Nav / contact / projects | `scripts/config.py` | rebuild |
| Layout / design | `assets/css/main.css` (and `assets/js/main.js` if needed) | rebuild |
| New product page | Add JSON for each language + update `scripts/slugs.py`, `config.py` | rebuild |
| New images | Add file to `assets/images/` and reference `/assets/images/<file>` in content JSON | rebuild |

Homepage carousel data lives in `content/{he,en,es}/slideshow.json`.

## Notes

- Images live under `assets/images/` with friendly aliases in `assets/image_aliases.json`.
- Content JSON uses local paths (`/assets/images/...`) only.
- Edit each language separately in `content/` — there is no auto-translation step in the build.

## Contact

- **Phone:** +972-3-6474998
- **Email:** cal@ddc.co.il
- **Address:** Habarzel 25, Tel Aviv, Israel
