FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app

# Installiere OpenSSL im Builder-Stage damit Prisma es erkennen kann
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Setze explizit den Binary Target für Prisma (OpenSSL 3.x in Bookworm)
ENV PRISMA_CLI_BINARY_TARGETS="debian-openssl-3.0.x"

# Generiere Prisma Client mit korrekter Engine
RUN npx prisma generate

# Baue Next.js als Standalone
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Installiere OpenSSL im Runner-Stage für Prisma Query Engine
RUN apt-get update -y && \
    apt-get install -y openssl && \
    rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/public ./public
# Standalone output benötigt diese Verzeichnisse
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Prisma und SQLite DB (als Master-Kopie für den ersten Start)
COPY --from=builder /app/prisma ./prisma
# Prisma Engine
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

COPY start.sh ./
COPY seed-admin.js ./
# bcryptjs wird für das Admin-Seed-Script benötigt
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
RUN chmod +x start.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
