FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-alpine AS runner
WORKDIR /app
RUN apk add --no-cache dumb-init
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/build ./build
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/scripts/start.sh ./scripts/start.sh
COPY --from=builder /app/scripts/migrate.js ./scripts/migrate.js
ENV NODE_ENV=production
EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["/bin/sh", "scripts/start.sh"]
