FROM node:20.10.0-alpine as builder

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci && npm cache clean --force

COPY . .

RUN npm run build

FROM nginx:alpine as production

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8766

CMD ["nginx", "-g", "daemon off;"]

FROM node:20.10.0-alpine as development

WORKDIR /app

COPY package.json package-lock.json* ./

RUN npm ci && npm cache clean --force

COPY . .

EXPOSE 8766

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "8766"]
