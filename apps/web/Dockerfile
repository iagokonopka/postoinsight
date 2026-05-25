# apps/web/Dockerfile
# Stage 1 — build
FROM node:20-alpine AS builder

# Enable pnpm via corepack
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /repo

# Copy workspace manifests first (better layer caching)
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (frozen lockfile)
RUN pnpm install --frozen-lockfile

# Copy source
COPY apps/web/ ./apps/web/
COPY packages/shared/ ./packages/shared/

# Build arg — injected by Railway at build time
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

WORKDIR /repo/apps/web
RUN pnpm run build

# ─────────────────────────────────────────────
# Stage 2 — serve
FROM nginx:alpine AS runner

COPY --from=builder /repo/apps/web/dist /usr/share/nginx/html
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]