# ---- deps ----
FROM oven/bun:1 AS deps
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# ---- builder ----
FROM oven/bun:1 AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Don't bake local secrets/DB into the image (see .dockerignore for .env)
ENV NEXT_TELEMETRY_DISABLED=1
RUN bunx prisma generate
RUN bun run build

# ---- runner ----
# NOTE: full node_modules is copied (not pruned) so sharp native bindings,
# Prisma engines and the generated Prisma Client are guaranteed present.
FROM oven/bun:1 AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3100
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh
# Drop privileges: never run the kiosk as root in production.
RUN useradd -m -u 10001 appuser \
  && mkdir -p /data/uploads \
  && chown -R appuser:appuser /app /data \
  && chmod +x ./docker-entrypoint.sh
USER appuser
EXPOSE 3100
ENTRYPOINT ["./docker-entrypoint.sh"]
