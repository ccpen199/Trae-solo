FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install --registry=https://registry.npmmirror.com

COPY . .
RUN npm run build

FROM nginx:alpine
WORKDIR /app

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

ENV SERVER_PORT=9471
ENV API_BASE_URL=http://backend:8362

EXPOSE 9471

CMD ["nginx", "-g", "daemon off;"]
