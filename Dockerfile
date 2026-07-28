# syntax=docker/dockerfile:1

ARG NODE_VERSION=22

# ---- base: shared setup for deps + builder ----
FROM node:${NODE_VERSION}-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

# ---- deps: install dependencies with pnpm store cache ----
# pnpm-workspace.yaml is intentionally not copied here: this is a single
# package, not a real multi-package workspace, and the file's only content
# (allowBuilds for sharp/unrs-resolver) governs postinstall scripts for
# packages that either ship prebuilt binaries or are never invoked at
# runtime here (images.unoptimized is true), so it isn't needed to install.
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

# ---- builder: compile the Next.js standalone build ----
# next build evaluates route modules to collect page data, and
# lib/supabaseAdmin.ts constructs the Supabase client at module load time,
# so real Supabase env vars must be present at build time too (same as this
# app's prior Vercel deployment required). The service-role key is passed as
# a BuildKit secret so it never lands in an image layer; the project URL
# isn't sensitive so it's a plain build arg.
FROM base AS builder
ENV NEXT_TELEMETRY_DISABLED=1
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN --mount=type=secret,id=supabase_service_role_key \
    --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    --mount=type=cache,id=next-cache,target=/app/.next/cache \
    SUPABASE_SERVICE_ROLE_KEY="$(cat /run/secrets/supabase_service_role_key)" pnpm build

# ---- runner: minimal production image ----
FROM node:${NODE_VERSION}-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD wget -q -O- http://127.0.0.1:3000/api/channel || exit 1

CMD ["node", "server.js"]
