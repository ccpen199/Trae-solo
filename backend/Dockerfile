FROM node:20-alpine AS base

WORKDIR /app

FROM base AS builder

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production
ENV PORT=47291

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 47291

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:47291/health || exit 1

CMD ["node", "dist/index.js"]
