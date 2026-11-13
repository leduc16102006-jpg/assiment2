# ADR-004: Thanh toán Idempotent & Tích hợp VNPay Sandbox

**Ngày:** 2026-11-13
**Người ra quyết định:** Bạn C
**Trạng thái:** Đã thông qua

---

## 1. Bối cảnh & Vấn đề
- **FR-06**: Thanh toán không bị trừ tiền nhiều lần khi rớt mạng
- Cần hỗ trợ 2 hình thức thanh toán: Nội bộ & VNPay Sandbox

## 2. Các Lựa chọn
| Cách chống trùng thanh toán | Ưu điểm | Nhược điểm |
|---|---|---|
| **Idempotency-Key (Header + DB Unique)** | Hoàn toàn chống trừ tiền 2 lần, chuẩn RESTful | Client phải sinh & quản lý mã UUID cho mỗi giao dịch |
| Kiểm tra trạng thái trước khi xử lý | Đơn giản hơn | Không đáng tin cậy 100% trong trường hợp bất đồng bộ |

## 3. Quyết định
✅ **Cơ chế Idempotency:**
- Client sinh `Idempotency-Key` (UUID) → gửi trong Header của mỗi yêu cầu thanh toán
- Lưu cột `idempotencyKey @unique` trong bảng Payment → nếu đã tồn tại → trả về kết quả cũ thay vì xử lý lại

✅ **Hai kênh thanh toán:**
| Kênh | Xử lý | Phản hồi |
|---|---|---|
| Nội bộ (WALLET/CARD) | Xử lý đồng bộ ngay tại Backend | Trả kết quả tức thì |
| VNPay Sandbox | Tạo URL chuyển hướng; xác nhận qua **IPN Webhook** với chữ ký **HMAC-SHA512** | Bất đồng bộ — có thể nhận thông báo sau vài giây/phút |

## 4. Đánh đổi (Trade-off)
| Được mất | Chi tiết |
|---|---|
| ✅ Được | An toàn không bao giờ trừ tiền 2 lần dù client gọi lại nhiều lần; xác thực giao dịch VNPay bằng chữ ký mã hóa |
| ⚠️ Đánh đổi | Client phải tự sinh và lưu `Idempotency-Key` cho mỗi lần thanh toán — nếu mất mã đó, không thể truy vấn trạng thái giao dịch cũ |

## 5. Hậu quả & Kiểm tra
- Cột `idempotencyKey` có ràng buộc UNIQUE ở Database — cơ sở chống trùng cuối cùng
- Luôn xác minh chữ ký HMAC-SHA512 từ VNPay trước khi cập nhật trạng thái đơn hàng
- Test: Gọi cùng `Idempotency-Key` 2 lần → lần 2 trả kết quả cũ, không tạo giao dịch mới
