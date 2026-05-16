# ---- Stage 1: build the Angular app ----
FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci
COPY . .
# Angular 19 "application" builder emits to dist/client/browser
RUN npm run build -- --configuration production

# ---- Stage 2: serve static files with nginx ----
FROM nginx:alpine

# SPA routing config (deep links fall back to index.html).
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/client/browser /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
