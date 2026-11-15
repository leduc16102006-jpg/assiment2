FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Chuyển sang stage Production (Standalone) ---
FROM node:20-alpine
WORKDIR /app

# Next.js standalone tự gom đủ node_modules cần thiết
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]