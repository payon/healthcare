#!/bin/sh
# Container entrypoint: apply Prisma migrations, optionally seed once, then run.
set -e

: "${DATABASE_URL:?DATABASE_URL must be set (e.g. postgresql://user:pass@db:5432/biogram?schema=public)}"
: "${JWT_SECRET:?JWT_SECRET must be set (min 32 chars)}"

echo "==> prisma migrate deploy"
bunx prisma migrate deploy

if [ "${SEED_ON_START:-false}" = "true" ]; then
  echo "==> seeding initial data (SEED_ON_START=true)"
  bun run db:seed || echo "seed skipped/failed (may already exist)"
fi

echo "==> starting kiosk on port ${PORT:-3100}"
exec bun ./server.js
