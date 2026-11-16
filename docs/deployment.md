## 1. Kiến trúc Triển khai (Deployment Architecture)
- **Frontend:** Triển khai trên **Vercel** (Tự động trigger khi nhánh `develop` có thay đổi). Môi trường Serverless, hỗ trợ HTTPS tự động.
- **Backend:** Triển khai trên **Render** dưới dạng Docker Container.
- **Database:** PostgreSQL triển khai trên **Neon.tech**. DB chỉ mở kết nối bảo mật qua chuỗi Connection String, không public trực tiếp cổng ra ngoài.

## 2. CI/CD Pipeline (GitHub Actions)
Pipeline được định nghĩa tại `.github/workflows/cd.yml` đáp ứng đủ 7 tiêu chí:
1. **Quality Gate:** Checkout code -> Cài đặt Node.js -> Chạy `npm run lint` & `npm run build`.
2. **Docker Image:** Build Image bằng Dockerfile.
3. **Push Registry:** Push Image lên GitHub Container Registry (GHCR) với tag là commit SHA và `latest`.
4. **Deploy:** Gọi webhook qua `curl -X POST` đến Render (truyền qua GitHub Secrets).
5. **Migration:** Render kéo Image mới nhất chạy ứng dụng; DB Migration được kiểm soát an toàn để không sập dữ liệu (Tránh lỗi schema not empty).
6. **Smoke Test:** Pipeline tự động gọi `curl` đến endpoint `/health`. Nếu HTTP status != 200, báo fail.
7. **Rollback:** Nếu Smoke Test thất bại, Pipeline dừng (Exit 1) và thông báo quy trình Rollback thủ công trên Render.

## 3. Quản lý Secret
Mọi API keys, JWT Secret, Database URLs và VNPay config đều được lưu trữ trong **GitHub Secrets**, **Render Environment Variables** và **Vercel Environment Variables**. Tuyệt đối không commit lên code repository.