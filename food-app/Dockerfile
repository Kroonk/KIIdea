FROM node:20-bookworm-slim AS base

FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generiere Prisma Client
RUN npx prisma generate
# Baue Next.js als Standalone
RUN npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
# openssl is natively integrated in bookworm

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
RUN chmod +x start.sh

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["./start.sh"]
