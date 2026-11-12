#!/usr/bin/env bash
# Copies DATABASE_URL and DIRECT_URL from your local .env into Vercel's
# Production and Preview environments, so the live site uses the same Supabase pooler
# connection that works locally. Values are piped straight from .env to the
# Vercel CLI and never printed.
#
# Usage (from the project root):  bash scripts/sync-vercel-db-env.sh
set -euo pipefail

cd "$(dirname "$0")/.."

VERCEL="npx --yes vercel@latest"
ENV_FILE=".env"
VARS=(DATABASE_URL DIRECT_URL)

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Can't find $ENV_FILE in $(pwd). Run this from the strengthwise-ai project." >&2
  exit 1
fi

# Read a variable's value from .env, dropping surrounding quotes.
read_env_value() {
  local line
  line="$(grep -E "^$1=" "$ENV_FILE" | tail -n 1 || true)"
  line="${line#*=}"
  line="${line%\"}"; line="${line#\"}"
  line="${line%\'}"; line="${line#\'}"
  printf '%s' "$line"
}

# Check both values exist before touching Vercel.
for name in "${VARS[@]}"; do
  if [[ -z "$(read_env_value "$name")" ]]; then
    echo "$name is missing or empty in $ENV_FILE. Nothing was changed." >&2
    exit 1
  fi
done

# Sanity check: the live site needs the pooler host, not the IPv6-only direct host.
if [[ "$(read_env_value DATABASE_URL)" != *"pooler.supabase.com"* ]]; then
  echo "Warning: DATABASE_URL in $ENV_FILE doesn't use the Supabase pooler host." >&2
  read -r -p "Continue anyway? [y/N] " answer
  [[ "$answer" =~ ^[Yy]$ ]] || exit 1
fi

echo "Step 1/3: Signing in to Vercel (skipped if you're already signed in)"
if ! $VERCEL whoami >/dev/null 2>&1; then
  $VERCEL login
fi

if [[ ! -f ".vercel/project.json" ]]; then
  echo "Linking this folder to your Vercel project"
  $VERCEL link
fi

echo "Step 2/3: Replacing database variables for Production and Preview"
for name in "${VARS[@]}"; do
  # --force overwrites the existing variable in place; the value comes from stdin.
  read_env_value "$name" | $VERCEL env add "$name" \
    --environment production,preview --force --sensitive --yes
  echo "  Updated $name"
done

echo "Step 3/3: Done."
echo "Now open your project on vercel.com, go to Deployments, open the ⋯ menu on the"
echo "latest deployment and choose Redeploy. New variables only apply to new deployments."
