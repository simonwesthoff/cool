# syntax=docker/dockerfile:1

# Node.js LTS, pinned to the major version in package.json "engines".
FROM node:26-slim AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build \
 && npx esbuild src/server/db/migrate.ts --bundle --platform=node --format=esm \
      --outfile=dist/migrate.mjs \
      --banner:js="import{createRequire}from'module';const require=createRequire(import.meta.url);"

FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    MIGRATIONS_DIR=/app/migrations
COPY --from=build --chown=node:node /app/.next/standalone ./
COPY --from=build --chown=node:node /app/.next/static ./.next/static
COPY --from=build --chown=node:node /app/public ./public
COPY --from=build --chown=node:node /app/dist/migrate.mjs ./migrate.mjs
COPY --from=build --chown=node:node /app/src/server/db/migrations ./migrations
USER node
EXPOSE 3000
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "node migrate.mjs && exec node server.js"]
