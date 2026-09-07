#!/usr/bin/env bash
# Stage cms apps for Firebase Hosting (flattens workspace deps into each app).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CMS="$ROOT/cms"
STAGE="$ROOT/.firebase-cms-stage"
rm -rf "$STAGE"
mkdir -p "$STAGE/web" "$STAGE/admin" "$STAGE/db"

echo "Copying @ddc/db…"
rsync -a --delete \
  --exclude node_modules --exclude dist \
  "$CMS/packages/db/" "$STAGE/db/"

stage_app() {
  local app="$1"
  local dest="$STAGE/$app"
  rsync -a --delete \
    --exclude node_modules --exclude .next --exclude .env.local --exclude .env \
    "$CMS/apps/$app/" "$dest/"

  node -e "
    const fs=require('fs');
    const p='$dest/package.json';
    const j=JSON.parse(fs.readFileSync(p,'utf8'));
    j.dependencies=j.dependencies||{};
    j.dependencies['@ddc/db']='file:../db';
    // Firebase Hosting frameworks runs npm install + next build in this folder
    j.scripts=j.scripts||{};
    j.scripts.build='next build';
    fs.writeFileSync(p, JSON.stringify(j,null,2)+'\n');
  "

  if [[ -f "$CMS/.env" ]]; then
    cp "$CMS/.env" "$dest/.env"
    cp "$CMS/.env" "$dest/.env.production"
  fi

  mkdir -p "$dest/data"
  cp "$CMS/data/public.json" "$dest/data/public.json"
  if [[ "$app" == "web" ]]; then
    mkdir -p "$dest/public/cms"
    cp "$CMS/data/public.json" "$dest/public/cms/public.json"
    # Symlink site assets into Next public so /assets/* works on Hosting
    if [[ -d "$ROOT/assets" ]]; then
      rm -rf "$dest/public/assets"
      mkdir -p "$dest/public"
      cp -R "$ROOT/assets" "$dest/public/assets"
    fi
  fi
  echo "Staged $app → $dest"
}

stage_app web
stage_app admin
echo "Done. Stage at $STAGE"
