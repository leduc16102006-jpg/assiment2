
# BrewLite — Hệ thống Đặt hàng Cà phê (Assignment 2)

Dự án BrewLite MVP tích hợp đầy đủ quy trình từ thiết kế yêu cầu đến triển khai tự động (Continuous Delivery/Deployment).

## 1. URL Bàn Giao (Production)

- **Frontend (Khách hàng):** https://assiment2-d8ubn0k3k-siuuu11.vercel.app
- **Backend API (Base URL):** https://brewlite-api-5dmc.onrender.com
- **Health Check API:** https://brewlite-api-5dmc.onrender.com/health
- **Tài liệu API (Swagger):** https://brewlite-api-5dmc.onrender.com/api/docs

## 2. Hướng dẫn chạy Local (Môi trường phát triển)

Hệ thống được đóng gói bằng Docker Compose. Giảng viên và người chấm có thể chạy dự án thông qua các bước sau:

1. **Clone repository:**

   ```bash
   git clone <link-repo-github-của-nhóm>
   cd brewlite-assiment2
   ```

2. **Cấu hình biến môi trường (BẮT BUỘC):** Hệ thống sử dụng các Secret (Database, JWT, VNPay) không được commit lên Git. Để chạy ứng dụng, vui lòng thực hiện:
   - Tại thư mục gốc, copy file `.env.example` thành file `.env`.
   - Tại thư mục `apps/api`, copy file `.env.example` thành file `.env`.
   - Tại thư mục `apps/web`, copy file `.env.example` thành file `.env.local`.

   **Thông tin Secret dành riêng cho Giảng viên nghiệm thu (Được cung cấp qua báo cáo/email):** Vui lòng điền các giá trị thực tế sau vào file `.env` của `apps/api` (hoặc liên hệ nhóm để nhận file `.env` đầy đủ):
   - `DATABASE_URL`: Sử dụng connection string của Neon.tech do nhóm cung cấp để kết nối đến DB mẫu, hoặc giữ nguyên `localhost` nếu muốn chạy DB mới tinh bằng Docker.
   - `JWT_SECRET`: Nhập chuỗi secret key do nhóm cung cấp.
   - `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`, `VNPAY_PAYMENT_URL`, `VNPAY_RETURN_URL`: Nhập thông tin tài khoản VNPay Sandbox của nhóm.
   - (Đối với Frontend): Cần cấu hình `NEXT_PUBLIC_API_URL=http://localhost:10000` trong file `.env.local` tại `apps/web`.

3. **Khởi chạy hệ thống:** Sau khi đã điền đủ thông tin vào các file `.env`, chạy lệnh:

   Bash

   ```bash
   docker compose up --build -d
   ```

4. **Khởi tạo dữ liệu (Nếu dùng Database Local mới):** Nếu không dùng DB Neon của nhóm mà dùng DB local mới tinh, cần chạy migration và seed dữ liệu:

   Bash

   ```bash
   cd apps/api
   npx prisma migrate deploy
   npx prisma db seed
   ```

5. **Kiểm tra trạng thái:**
   - Frontend chạy tại: `http://localhost:3000`
   - Backend API chạy tại: `http://localhost:10000`
   - Database PostgreSQL local chạy ở cổng `5432`.

## 3. Hướng dẫn Test & Build

Mở terminal, di chuyển vào thư mục `apps/api` và chạy:

- **Quality Gate (Lint & Build):** `npm run lint` và `npm run build`
- **Unit & Integration Test:** `npm test`
- **End-to-End Test (E2E):** `npm run test:e2e`

## 4. Hướng dẫn Deploy & Rollback

- **Deploy:** Quá trình deploy hoàn toàn tự động qua GitHub Actions khi có code mới merge vào nhánh `develop`. (Chi tiết kiến trúc CI/CD xem tại `docs/deployment.md`).
- **Rollback Frontend (Vercel):** Vào Dashboard Vercel > Tab *Deployments* > Chọn bản build cũ đang xanh > Bấm `...` > *Redeploy*.
- **Rollback Backend (Render):** Vào Dashboard Render > Tab *Deploys* > Chọn bản deploy cũ > Bấm *Rollback to this deploy*.

## 5. Hướng dẫn Giám sát (Monitoring, Logs & Database)

- **Xem Health Check:** Truy cập trực tiếp đường dẫn Health Check ở phần 1. Trả về HTTP 200 kèm JSON là API sống.
- **Xem Logs Server (Backend):** Đăng nhập Render Dashboard > Chọn dịch vụ `brewlite-api` > Xem trực tiếp tại tab *Logs*.
- **Xem Logs UI (Frontend):** Đăng nhập Vercel Dashboard > Chọn dự án > Tab *Logs*.
- **Kiểm tra Database Production:** Database được host an toàn trên Neon.tech (không public secret). Để nghiệm thu dữ liệu thật, người quản trị có thể dùng URL kết nối an toàn (cấp riêng) cắm vào phần mềm DBeaver hoặc chạy lệnh `npx prisma studio` từ máy có quyền truy cập.
