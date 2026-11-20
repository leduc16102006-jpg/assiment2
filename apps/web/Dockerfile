FROM node:20-alpine AS builder
WORKDIR /app

# Nhận biến NEXT_PUBLIC_API_URL ngay lúc build (Next.js đóng gói biến public tại build-time)
ARG NEXT_PUBLIC_API_URL=http://localhost:10000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Chuyển sang stage Production (Standalone) ---
FROM node:20-alpine
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Next.js standalone tự gom đủ node_modules cần thiết
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
CMD ["node", "server.js"]