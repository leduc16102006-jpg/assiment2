# Sử dụng Node.js 20 bản nhẹ
FROM node:20-alpine AS builder
WORKDIR /app

# Copy các file cấu hình package
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn Backend
COPY . .

# Khởi tạo Prisma và Build NestJS
RUN npx prisma generate
RUN npm run build

# --- Chuyển sang stage Production để giảm dung lượng ---
FROM node:20-alpine
WORKDIR /app

# Copy các file đã build và node_modules từ bước builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
# ✅ SỬA: Chạy Prisma Migrate Deploy an toàn trước khi khởi động Node.js
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]