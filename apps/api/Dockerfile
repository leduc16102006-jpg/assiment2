# Sử dụng Node.js 20 bản nhẹ
FROM node:20-alpine AS builder
WORKDIR /app

# Cài đặt OpenSSL cho Prisma Engine trên Alpine Linux
RUN apk add --no-cache openssl

# Copy các file cấu hình package
COPY package*.json ./
RUN npm ci

# Copy toàn bộ mã nguồn Backend
COPY . .

# Khởi tạo Prisma Client và Build NestJS
RUN npx prisma generate
RUN npm run build

# --- Chuyển sang stage Production để giảm dung lượng ---
FROM node:20-alpine
WORKDIR /app

RUN apk add --no-cache openssl

# Copy các file đã build và tài nguyên Prisma từ bước builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

EXPOSE 10000

# Chạy Prisma Migrate Deploy an toàn trước khi khởi động NestJS
CMD ["sh", "-c", "./node_modules/.bin/prisma migrate deploy && node dist/main"]