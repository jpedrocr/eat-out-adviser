# =============================================================================
# Eat Out Adviser - Dockerfile Multi-Stage (Next.js 16)
# =============================================================================
# Build multi-arch: linux/amd64 (Intel N5105) + linux/arm64 (Apple M1)
#
# Uso:
#   docker buildx build --platform linux/amd64,linux/arm64 -f docker/Dockerfile.app .
# =============================================================================

# ---------------------------------------------------------------------------
# Etapa 1: Dependencias
# ---------------------------------------------------------------------------
FROM node:22-alpine AS deps

RUN corepack enable && corepack prepare pnpm@10.6.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/
COPY packages/db/package.json ./packages/db/
COPY packages/api/package.json ./packages/api/
COPY packages/ai/package.json ./packages/ai/
COPY packages/scoring/package.json ./packages/scoring/
COPY mcp/package.json ./mcp/

RUN pnpm install --frozen-lockfile --prod=false

# ---------------------------------------------------------------------------
# Etapa 2: Build
# ---------------------------------------------------------------------------
FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10.6.0 --activate

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN pnpm --filter @eat-out-adviser/web build

# ---------------------------------------------------------------------------
# Etapa 3: Runner (producao)
# ---------------------------------------------------------------------------
FROM node:22-alpine AS runner

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copiar artefactos do build
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
