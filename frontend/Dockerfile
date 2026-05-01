FROM node:20-alpine AS base

WORKDIR /app

FROM base AS builder

ENV VITE_PORT=47292
ENV VITE_API_URL=http://localhost:47291

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine AS runner

ENV PORT=47292

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 47292

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:47292/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
