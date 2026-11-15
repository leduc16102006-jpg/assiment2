
# BrewLite - Hệ thống Đặt Đồ Uống & Thanh Toán (Assignment 2)

Dự án BrewLite là một hệ thống đặt đồ uống trực tuyến toàn diện, bao gồm Frontend (Next.js PWA) và Backend (NestJS, PostgreSQL). Dự án được triển khai tự động qua CI/CD Pipeline (GitHub Actions) lên môi trường Vercel và Render.

2. **Cấu hình môi trường:** Tạo tệp `.env` tại thư mục gốc và sao chép cấu hình từ `.env.example` (bao gồm các cấu hình VNPay Sandbox của bạn).
3. **Khởi chạy hệ thống:**

   Bash
   ```
   docker compose up --build

   ```
4. **Truy cập:**
   - Frontend: `http://localhost:3001`
   - Backend API: `http://localhost:3000`

## 🧪 Hướng dẫn Chạy Kiểm Thử (Testing)

Hệ thống bao gồm Unit Test, Integration Test và E2E Test.

- **Chạy Linter:** `npm run lint` (tại thư mục `apps/api` và `apps/web`)
- **Chạy E2E Test (Backend):**

  Bash
  ```bash
  cd apps/api
  npx prisma db seed # Đổ dữ liệu mẫu vào test db
  npm run test:e2e

  ```

## ⚙️ Quy trình Triển Khai (Deployment Pipeline)

Hệ thống sử dụng **GitHub Actions** cho Continuous Deployment.

1. Khi có code mới đẩy lên nhánh `main` hoặc tạo Tag Release, Pipeline sẽ tự động kích hoạt.
2. **Quality Gate:** Chạy linter, build ứng dụng và đảm bảo không có lỗi biên dịch.
3. **Dockerize & Push:** Build 2 Docker Image (Web, API) có tag SHA và đẩy lên GitHub Container Registry (GHCR).
4. **Deploy & Migrate:** Bắn Webhook sang Render để kéo Image API về, tự động chạy lệnh `npx prisma migrate deploy` an toàn để đồng bộ Database.
5. **Smoke Test:** Ping `GET /health` để đảm bảo API đang sống.

## 🔄 Quy trình Khôi Phục Sự Cố (Rollback)

Nếu Smoke Test báo lỗi (Exit code khác 0), pipeline CI sẽ lập tức báo đỏ.

- **Khôi phục tức thời (Render Dashboard):** Truy cập Render Dashboard -> Web Service -> Deploys. Chọn bản Build thành công gần nhất và nhấn **"Rollback to this deploy"**. Dịch vụ sẽ trực tuyến lại trong chưa tới 30 giây (Zero-Downtime Rollback). "

## 🚀 Các URL Môi Trường Production

*   **Frontend (Vercel):** `https://assiment2-d8ubn0k3k-siuuu11.vercel.app`
*   **Backend API & Health Check (Render):** `https://brewlite-api-5dmc.onrender.com/health`
*   **Swagger API Docs:** `https://brewlite-api-5dmc.onrender.com/api/docs`

> **Bảo mật:** Database PostgreSQL được lưu trữ an toàn trên Internal Network của Render, tuyệt đối không mở cổng ra public internet. Mọi secret key đều được bảo vệ nghiêm ngặt.

## 🛠 Hướng dẫn Khởi Chạy Local (Docker Compose)

Dự án được đóng gói 100% bằng Docker, cho phép bạn khởi chạy toàn bộ hệ thống (Web, API, DB) chỉ bằng 1 lệnh.

1. **Clone repository:**
   ```bash
   git clone [https://github.com/leduc16102006-jpg/assiment2.git](https://github.com/leduc16102006-jpg/assiment2.git)
   cd assiment2
   ```
