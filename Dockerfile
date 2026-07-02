# ─── Multi-stage build for Erlbrew backend ─────────────────────────────────
# Target: Raspberry Pi 4B (ARM64) + Cloudflare Tunnel or direct.
# ────────────────────────────────────────────────────────────────────────────

# ── Builder stage ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

WORKDIR /build

# Install only what's needed for native modules (bcrypt)
RUN apt-get update -qq && apt-get install -y -qq --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package manifests first for Docker layer caching
COPY server/package.json server/package-lock.json ./server/
RUN cd server && npm ci

# Copy source code (excluding node_modules via .dockerignore)
COPY server/ ./server/
COPY *.html ./

# Build Tailwind CSS into public/tailwind.css
RUN cd server && chmod +x node_modules/.bin/tailwindcss && npm run build:css

# ── Runtime stage ──────────────────────────────────────────────────────────
FROM node:20-bookworm-slim

WORKDIR /app

# Install only runtime OS deps (none needed—bcrypt ships prebuilt for ARM64)
# Create uploads directory (persisted via Docker volume)
RUN mkdir -p /app/server/uploads

# Copy production dependencies (no devDeps)
COPY --from=builder /build/server/node_modules ./server/node_modules

# Copy application code
COPY --from=builder /build/server ./server/
COPY --from=builder /build/*.html ./

EXPOSE 3000

# dotenv loads server/.env at startup — mount it as a volume
CMD ["node", "server/server.js"]
