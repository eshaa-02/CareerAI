# ---- Base ----
FROM node:18-alpine AS base
WORKDIR /app
RUN apk add --no-cache dumb-init

# ---- Dependencies ----
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# ---- Runtime ----
FROM base AS runner
ENV NODE_ENV=production
RUN addgroup -g 1001 -S nodejs && adduser -S expressjs -u 1001

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Ensure upload directories exist and are writable by the non-root user
RUN mkdir -p uploads/resumes uploads/avatars uploads/logos \
  && chown -R expressjs:nodejs /app

USER expressjs

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# dumb-init handles signal forwarding correctly so SIGTERM (e.g. from
# `docker stop` or Railway/Render deploys) triggers the graceful shutdown
# already implemented in server.js instead of being swallowed by PID 1.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
