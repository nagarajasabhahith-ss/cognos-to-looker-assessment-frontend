# Frontend: development (default) and production (--target production)
# Use: DOCKER_BUILDKIT=1 docker compose build (or docker buildx build) for cache mounts
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./
# Optional: add --mount=type=cache,target=/root/.npm for faster repeated local builds (requires BuildKit)
RUN npm ci
COPY . .

# Production build stage
FROM base AS builder
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_APP_NAME=C2L Assessment
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME
RUN npm run build

# Production image (standalone) - use: docker build --target production
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]

# Development image (default for docker-compose)
FROM base AS development
EXPOSE 3000
CMD ["npm", "run", "dev"]
