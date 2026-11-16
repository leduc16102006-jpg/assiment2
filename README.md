
# BrewLite — Đặt hàng Cà phê (Assignment 2)

## 1. URL Production & Thông tin
- **Frontend (Vercel):** https://assiment2-d8ubn0k3k-siuuu11.vercel.app
- **Backend API (Render):** https://brewlite-api-5dmc.onrender.com
- **Health Check API:** https://brewlite-api-5dmc.onrender.com/health

## 2. Hướng dẫn chạy Local (Theo NFR-04.1)
1. Clone repository về máy.
2. Tại thư mục gốc, copy `.env.example` thành `.env` (cho cả root, `apps/api` và `apps/web`) và điền các biến môi trường cần thiết (JWT Secret, Database URL local...).
3. Chạy lệnh dựng toàn bộ môi trường (Frontend, Backend, PostgreSQL):
   ```bash
   docker compose up --build -d
   ```

4. Truy cập Web tại `http://localhost:3000` và API tại `http://localhost:10000`.

## 3. Hướng dẫn chạy Test

Di chuyển vào thư mục `apps/api` và chạy các lệnh:

- **Unit & Integration Test:** `npm test`
- **End-to-End Test:** `npm run test:e2e`

## 4. Hướng dẫn Deploy

- CI/CD được tự động hóa bằng GitHub Actions (`.github/workflows/cd.yml`).
- Khi push code vào nhánh `develop`, CI sẽ tự động chạy Quality Gate (Lint, Test, Build), đóng gói Docker Image đẩy lên GHCR, và gọi webhook sang Render để deploy Backend.
- Frontend Next.js được Vercel tự động lắng nghe và deploy khi có thay đổi.

## 5. Hướng dẫn Rollback (Tiêu chí 7 - Task 5.3)

Nếu bản deploy Production bị lỗi (Smoke Test thất bại hoặc lỗi runtime):

1. Đăng nhập vào Dashboard Render ([https://dashboard.render.com](https://dashboard.render.com)).
2. Chọn dịch vụ `brewlite-api` -> Chuyển sang tab **Deploys**.
3. Tìm bản Deploy xanh (Success) gần nhất trước đó.
4. Bấm vào nút **Rollback to this deploy**.
5. Trên Vercel (Frontend), vào tab **Deployments**, chọn bản deploy cũ đang hoạt động tốt, bấm dấu ba chấm `...` và chọn **Redeploy**.
