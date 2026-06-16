# DDC Website (ישומי בקרה / Control Applications)

Static bilingual site for DDC / Control Applications, deployable to Firebase Hosting or GCP.

**Live sources (reference):**
- Hebrew: [ddc.co.il](https://www.ddc.co.il/)
- English: [elnet-meter.com](https://www.elnet-meter.com/)

## What's included

- **58 pages per language** — products, categories, projects, about, contact
- Bilingual navigation with dropdown menus
- RTL layout for Hebrew, LTR for English
- Homepage carousel, contact footer with map

## Project structure

```
ddc-website/
├── site/              # Deployable static site (build output)
│   ├── he/            # Hebrew pages (canonical English URL slugs)
│   ├── en/            # English pages
│   └── assets/        # CSS, JS, images
├── scraped/           # Page content (JSON, one file per page per language)
│   ├── he/
│   └── en/
├── scripts/
│   ├── build_site.py       # Generate HTML from scraped JSON
│   ├── config.py           # Navigation, projects, site config
│   ├── slugs.py            # Canonical page slug list
│   ├── build_image_aliases.py
│   ├── download_assets.py  # Optional: fetch images from Wix CDN
│   ├── image_assets.py
│   └── document_assets.py
├── assets/            # Source CSS/JS/images (copied to site/ on build)
└── firebase.json
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

## Deploy to Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase deploy
```

(`firebase.json` already points `public` at `site/`.)

## Maintaining content

| Change | Edit | Then |
|--------|------|------|
| Page copy | `scraped/he/<slug>.json` and `scraped/en/<slug>.json` | `python scripts/build_site.py` |
| Nav / contact / projects | `scripts/config.py` | rebuild |
| Layout / design | `assets/css/main.css` (and `assets/js/main.js` if needed) | rebuild |
| New product page | Add JSON for both langs + update `scripts/slugs.py`, `config.py` | rebuild |
| New images (Wix URLs in JSON) | Optional: `python scripts/download_assets.py` | rebuild |

Homepage carousel data lives in `scraped/{he,en}/slideshow.json`.

## Notes

- Images are stored locally under `assets/images/` with friendly aliases in `assets/image_aliases.json`.
- Run `python scripts/download_assets.py` when you add pages that reference new Wix CDN image URLs.
- Edit Hebrew and English content separately in `scraped/` — there is no auto-translation step in the build.

## Contact

- **Phone:** +972-3-6474998
- **Email:** cal@ddc.co.il
- **Address:** Habarzel 25, Tel Aviv, Israel
