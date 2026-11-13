# ADR-003: Kiến trúc Modular Monolith với NestJS

**Ngày:** 2026-11-13
**Người ra quyết định:** Bạn C
**Trạng thái:** Đã thông qua

---

## 1. Bối cảnh & Vấn đề
Từ Task 1 & Task 2:
- **FR-05**: Tạo đơn hàng
- **FR-06**: Thanh toán
- **FR-08**: Quản lý trạng thái đơn hàng (State Machine)
- **FR-09~10**: Áp dụng khuyến mãi & điểm thành viên

Toàn bộ luồng: Tạo đơn → Trừ nguyên liệu → Áp dụng mã giảm giá → Cộng điểm thành viên cần đảm bảo tính nhất quán dữ liệu trong một giao dịch ACID.

## 2. Các Lựa chọn
| Lựa chọn | Ưu điểm | Nhược điểm |
|---|---|---|
| **Modular Monolith (NestJS)** | Toàn bộ luồng trong 1 Transaction ACID, dễ vận hành (chỉ 1 container), module hóa rõ ràng, dễ tách microservices sau này | Khả năng mở rộng theo chiều ngang hạn chế hơn |
| Tách Microservices | Độc lập triển khai, mở rộng theo tải | Phân tán dữ liệu → cần Saga/Orchestration; phức tạp hơn nhiều |

## 3. Quyết định
✅ **Chọn Modular Monolith** với NestJS, tổ chức theo Domain Module

**Cấu trúc luồng Request — 4 lớp:**
1. **Presentation Layer**: Controllers, DTOs + ValidationPipe
2. **Security Layer**: JwtAuthGuard, RolesGuard
3. **Domain Modules**:
   - `ProductsModule` — Menu, Size, Topping
   - `OrdersModule` — Tạo đơn, quản lý trạng thái
   - `PaymentsModule` — Xử lý thanh toán & Idempotency
   - `PromotionsModule` — Mã giảm giá, điểm thành viên
4. **Data Access Layer**: PrismaService — duy nhất tương tác với Database

## 4. Đánh đổi (Trade-off)
| Được mất | Chi tiết |
|---|---|
| ✅ Được | Đảm bảo ACID tự nhiên trong toàn luồng đơn hàng; dễ vận hành, deploy chỉ 1 container; module hóa tốt, sẵn sàng tách microservices khi hệ thống lớn hơn |
| ⚠️ Đánh đổi | Tất cả module chia sẻ cùng instance Database & tài nguyên — cần tối ưu truy vấn khi tải tăng |

## 5. Hậu quả & Kiểm tra
- Mỗi domain có module riêng, tách biệt logic nghiệp vụ
- Transaction Prisma bao bọc toàn bộ bước tạo đơn → đảm bảo nếu 1 bước lỗi, không có gì thay đổi
- Tương lai: Nếu cần mở rộng → tách từng module thành microservice mà không thay đổi logic bên trong
