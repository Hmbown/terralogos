# syntax=docker/dockerfile:1

# Production-like image (static preview of the Vite build)
FROM node:20-slim AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-slim AS preview
WORKDIR /app
COPY --from=builder /app /app
EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "4173"]
