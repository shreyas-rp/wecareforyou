# ---- WeCareForYou API (Express/Node) ----
FROM node:22-alpine

ENV NODE_ENV=production
WORKDIR /app

# Install only production dependencies first (better layer caching).
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# App source.
COPY . .

EXPOSE 5000

# Basic container healthcheck against the public health route.
HEALTHCHECK --interval=20s --timeout=5s --start-period=15s --retries=5 \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1

CMD ["node", "server.js"]
