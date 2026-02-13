# Build stage: use Node for deterministic npm install
FROM node:hydrogen-alpine AS builder
WORKDIR /app
COPY package*.json /app/
RUN npm ci
COPY . /app/
RUN npm run build

# Runtime stage: use Bun (app requires Bun's serve API)
FROM oven/bun:1-alpine
ENV PORT=1234

# Installs Chromium for Puppeteer
RUN apk add chromium chromium-lang

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app
COPY --from=builder /app/package*.json /app/
COPY --from=builder /app/node_modules /app/node_modules
COPY --from=builder /app/build /app/build

EXPOSE ${PORT}
CMD [ "bun", "run", "build/index.js" ]
