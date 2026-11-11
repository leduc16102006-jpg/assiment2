# Task 2.2: Sequence Diagram

**Dự án:** BrewLite — Assignment 2: Requirements to Deployment
**Nhiệm vụ:** Vẽ Sequence Diagram cho Use-Case UC-05: Đặt và Thanh Toán Đơn Hàng
**Ngày:** 11/11/2026
**Phiên bản:** 1.0

---

## 1. Thông tin tài liệu

Table

| Thông tin | Nội dung |
| --- | --- |
| **Tên Use-Case** | Đặt và Thanh Toán Đơn Hàng |
| **Mã Use-Case** | UC-05 |
| **Hệ thống** | BrewLite |
| **Công nghệ** | Next.js (UI) → NestJS (API) → PostgreSQL (DB) → VNPay Sandbox (Payment) |
| **Ngôn ngữ sơ đồ** | PlantUML |
| **Tệp mã nguồn** | `sequence-checkout.puml` |
| **Tệp hình ảnh** | `sequence-checkout.svg` |

---

## 2. Mục tiêu

Sequence Diagram mô tả chi tiết luồng tương tác giữa các thành phần hệ thống khi khách hàng thực hiện đặt hàng và thanh toán online. Sơ đồ làm rõ:

- Thứ tự gọi API và luồng request/response
- Cách hệ thống kiểm tra an ninh và dữ liệu
- Xử lý dữ liệu an toàn qua Database Transaction
- Phân nhánh xử lý thành công và các trường hợp lỗi
- Cơ chế ngăn chặn giao dịch trùng lặp

---

## 3. Lifeline tham gia

Table

| STT | Tên | Vai trò |
| --- | --- | --- |
| 1 | **Khách Hàng (Customer)** | Actor chính — người thực hiện đặt hàng và thanh toán |
| 2 | **Next.js UI** | Giao diện người dùng — nhận thao tác & hiển thị kết quả |
| 3 | **NestJS API** | Backend — xử lý nghiệp vụ, xác thực, gọi dịch vụ |
| 4 | **PostgreSQL** | CSDL — lưu trữ đơn hàng, thanh toán, tồn kho, điểm thành viên |
| 5 | **Payment Service** | VNPay Sandbox — cổng thanh toán môi trường giả lập |

---

## 4. Cấu trúc sơ đồ

### 4.1 Các khối logic chính

Table

| Khối | Mô tả |
| --- | --- |
| **Idempotency Check** | Kiểm tra `Idempotency-Key` — nếu đã tồn tại, trả kết quả cũ ngay |
| **Xác thực & Validate** | Kiểm tra JWT hợp lệ và dữ liệu đầu vào đúng định dạng |
| **Transaction Tạo đơn & Cập nhật kho** | `BEGIN` → Kiểm tra tồn kho (khóa dòng `FOR UPDATE`) → Tạo đơn → `COMMIT` hoặc `ROLLBACK` |
| **Thanh toán Thành công** | Xác minh IPN HMAC-SHA512 → Cập nhật trạng thái PAID → Tích điểm (nếu đủ điều kiện) → Thông báo & dọn giỏ hàng |
| **Thanh toán Thất bại** | Cập nhật trạng thái PAYMENT_FAILED → Hoàn trả nguyên liệu về kho → Thông báo, giữ nguyên giỏ hàng |

### 4.2 Cấu trúc điều khiển sử dụng

Table

| Từ khóa PlantUML | Mục đích |
| --- | --- |
| `alt` | Phân nhánh if-else (thành công/thất bại; đủ/hết hàng; JWT hợp lệ/không) |
| `opt` | Bước tùy chọn — chỉ chạy khi thỏa điều kiện (tích điểm thành viên) |
| `note` | Ghi chú giải thích các bước quan trọng |
| `==` | Phân đoạn luồng logic |
| `autonumber` | Đánh số thứ tự các tin nhắn |

---

## 5. Yêu cầu đã đáp ứng

Table

| ✅ Yêu cầu | Vị trí trong sơ đồ |
| --- | --- |
| Request/Response và thứ tự gọi API | Toàn bộ luồng được đánh số rõ ràng từ trên xuống |
| Kiểm tra JWT và validate dữ liệu | Ngay sau Idempotency check — nhánh `alt` riêng |
| Transaction tạo đơn & cập nhật tồn kho | Bọc toàn bộ trong `BEGIN TRANSACTION` → `COMMIT/ROLLBACK` |
| Nhánh alt thanh toán thành công/thất bại | Hai nhánh rõ ràng với xử lý khác nhau |
| Idempotency tránh giao dịch trùng | Bước đầu tiên — kiểm tra trước bất kỳ xử lý nào khác |
| Thông báo kết quả cuối cùng | Mỗi nhánh đều trả thông báo cụ thể về cho Khách Hàng |
| Xác minh IPN HMAC-SHA512 | Trước khi cập nhật trạng thái đơn hàng thành PAID |
| Hoàn trả nguyên liệu khi thanh toán thất bại | Luồng thất bại: `UPDATE stock +` trong transaction riêng |

---

## 6. Tính nhất quán với tài liệu trước đó

Table

| Tài liệu | Mức độ nhất quán |
| --- | --- |
| **SRS — Task 1.2 (FR/NFR)** | ✅ Hoàn toàn nhất quán: FR-04, FR-05, FR-06, FR-10, NFR-05 đều được thể hiện chính xác |
| **Use-Case — Task 1.3 (UC-05)** | ✅ Phản ánh đúng luồng chính, luồng thay thế và luồng ngoại lệ |
| **Mô hình dữ liệu** | ✅ Đúng trạng thái đơn hàng (PENDING → PAID/PAYMENT_FAILED); đúng quy tắc transaction |

---

## 7. Tệp liên quan

Table

| Tệp | Đường dẫn |
| --- | --- |
| Sequence Diagram (mã nguồn) | `docs/diagrams/sequence-checkout.puml` |
| Sequence Diagram (hình ảnh) | `docs/diagrams/sequence-checkout.svg` |
| SRS — Task 1.2 | `docs/requirements/srs.md` |
| Use-Case — Task 1.3 | `docs/requirements/task1.3-use-case-checkout.md` |
| Use-Case Diagram | `docs/diagrams/task1.3-diagram.svg` |



