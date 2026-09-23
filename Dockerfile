# ==============================================================================
# DocuForge 2.0 - Multi-Platform Dockerfile (Raspberry Pi ARM64 / ARMv7 & AMD64)
# Optimized for low memory consumption, high-fidelity PDF tools, and LibreOffice
# ==============================================================================

# Stage 1: Install Node.js dependencies
FROM node:20-bookworm-slim AS deps
WORKDIR /app

# Install build essentials if native node-gyp bindings are required
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --prefer-offline --no-audit

# Stage 2: Build the Next.js standalone application
FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure public directory exists
RUN mkdir -p public

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# Stage 3: Production lightweight runner
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Install headless LibreOffice with Writer/Calc filters, fonts, and OCR utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer-nogui \
    libreoffice-calc-nogui \
    libreoffice-impress-nogui \
    libreoffice-draw-nogui \
    tesseract-ocr \
    tesseract-ocr-eng \
    poppler-utils \
    qpdf \
    python3 \
    python3-pip \
    ca-certificates \
    fonts-liberation \
    fonts-dejavu-core \
    fonts-noto-core \
    && rm -rf /var/lib/apt/lists/*

# Install python pymupdf & pdf2docx for direct script fallback
RUN pip3 install --no-cache-dir --break-system-packages pymupdf pdf2docx 2>/dev/null || true

# Setup non-root system user with writable home directory for LibreOffice profiles
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 --home /home/nextjs --shell /bin/sh nextjs && \
    mkdir -p /home/nextjs && \
    chown -R nextjs:nodejs /home/nextjs

ENV HOME=/home/nextjs

# Copy Next.js standalone output and public assets
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
