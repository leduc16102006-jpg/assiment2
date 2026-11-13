# ADR-005 — PostgreSQL, Prisma và Optimistic Locking cho tồn kho BrewLite

- **Mã:** ADR-005
- **Ngày:** 13/11/2026
- **Trạng thái quyết định:** Accepted (nhóm đã chọn PostgreSQL + Prisma + Optimistic Locking cho kiến trúc; cấu hình production còn phải kiểm chứng)
- **Người phụ trách:** Đinh Hữu Tiến (E)

## 1. Bối cảnh và vấn đề

BrewLite có nhiều khách có thể đặt cùng đồ uống khi nguyên liệu còn ít. Một lượt đặt tạo đơn và trừ/giữ tồn kho cho **nhiều nguyên liệu**. Nếu hai yêu cầu đồng thời đọc cùng giá trị tồn kho rồi cùng ghi giảm, hệ thống có thể bán vượt số nguyên liệu còn lại hoặc lưu đơn chưa được giữ đủ nguyên liệu. Các nghiệp vụ `Order`, `OrderItem`, `Ingredient`, `OrderIngredient`, `Payment` và `LoyaltyTransaction` cũng cần ràng buộc dữ liệu nhất quán và truy vết được.

Bài toán thiết kế cần trả lời: chọn nền tảng dữ liệu, cơ chế quản lý migration và cách giải quyết tranh chấp tồn kho sao cho **an toàn trước concurrency**, dễ kiểm thử, phù hợp kiến trúc NestJS modular monolith.

## 2. Quyết định kiến trúc

Nhóm chọn **PostgreSQL** làm CSDL quan hệ tập trung, truy cập qua **Prisma ORM/Prisma Client** trong backend NestJS. Mọi thay đổi cấu trúc CSDL phải được quản lý theo phiên bản bằng `schema.prisma` và thư mục `prisma/migrations/`. Trong local sử dụng `prisma migrate dev`; production/staging dùng `prisma migrate deploy` ở bước phát hành có kiểm soát.

**Quyết định về seed:** dùng `npx prisma db seed` để khởi tạo dữ liệu mẫu **ở local/test**, dựa trên bộ script `backend/prisma/seed-all.ts` cùng các script seed trong Assignment 1. `seed-all.ts` hiện có chặn chạy khi `NODE_ENV=production`; vì vậy **không coi seed mẫu production là bước triển khai mặc định**. Việc chuẩn hóa pipeline tái tạo DB test và test seed lặp lại là phần cần hoàn thiện/kiểm chứng trong **Assignment 2 (FR-12)**.

Đối với nguyên liệu, chọn **Optimistic Locking bằng `Ingredient.version` kết hợp điều kiện `stock >= requiredQuantity`**, thay vì sử dụng khóa bi quan tường minh `SELECT ... FOR UPDATE` trong phần lớn luồng đặt đơn.

Quy trình cơ bản khi `POST /orders`:

1. Xác thực khách và kiểm tra giỏ không rỗng, validate DTO.
2. Bắt đầu Prisma interactive transaction.
3. Tính lại giá/định lượng ở backend; đọc nguyên liệu và phiên bản `version`.
4. Với từng nguyên liệu, thực hiện `updateMany` có điều kiện đồng thời `id`, `version` hiện tại và `stock >= số lượng cần`, sau đó giảm `stock` và tăng `version`.
5. Nếu `count !== 1` hoặc thiếu kho, ném lỗi để rollback **toàn bộ transaction**; không để đơn dở dang hay trừ kho không đầy đủ.
6. Nếu thành công, tạo `Order` ở `PENDING` kèm `OrderItem`, `OrderIngredient` và `ingredientsReserved=true`, rồi commit.
7. Khi trạng thái đơn yêu cầu hoàn kho, sử dụng dữ liệu đã lưu và cờ `ingredientsReserved` để tránh hoàn lặp.

Rút gọn đoạn triển khai tham chiếu:

```typescript
const result = await tx.ingredient.updateMany({
  where: {
    id: ingredient.id,
    version: ingredient.version,
    stock: { gte: requirement.quantity },
  },
  data: {
    stock: { decrement: requirement.quantity },
    version: { increment: 1 },
  },
});
if (result.count !== 1) {
  throw new ConflictException('Tồn kho đã thay đổi. Vui lòng thử lại');
}
```

## 3. Các phương án được cân nhắc

| Phương án | Ưu điểm | Đánh đổi / Lý do không chọn làm mặc định |
|---|---|---|
| **PostgreSQL + Prisma + Optimistic Locking** (được chọn) | ACID transaction, ràng buộc quan hệ, dễ tạo migration; cập nhật có điều kiện tránh overwrite bằng version cũ; không giữ khóa bi quan tường minh qua toàn bộ xử lý | Có thể trả conflict khi nhiều khách tranh chấp; client phải xử lý thông báo/thử lại; cần bài test concurrency |
| **PostgreSQL + `SELECT FOR UPDATE` (Pessimistic Locking)** | Có thể tuần tự hóa việc tranh chấp bằng khóa hàng | Request có thể phải đợi khóa, ảnh hưởng latency và tài nguyên khi cạnh tranh cao; rủi ro deadlock nếu khóa nhiều nguyên liệu khác thứ tự |
| **Chỉ đọc số lượng rồi cập nhật không kiểm tra version** | Code ngắn, ít câu lệnh | Không đảm bảo an toàn trong cạnh tranh; có nguy cơ lost update/bán vượt kho → loại bỏ |
| **Lưu trạng thái tồn kho/đơn trên client** | Giảm phụ thuộc DB khi hiển thị | Không đáng tin cậy để quyết định tồn kho thật; dễ bị sửa dữ liệu → loại bỏ |

Lưu ý kỹ thuật: Optimistic Locking không có nghĩa PostgreSQL không đặt row lock khi thực hiện `UPDATE`; nó tránh việc ứng dụng phải chủ động giữ **khóa bi quan tường minh** trong lúc đọc và quyết định. Hiệu năng tốt hơn hay kém hơn phụ thuộc mức tranh chấp thực tế và phải được đo, không khẳng định như một kết quả kiểm thử.

## 4. Hệ quả, rủi ro và cách giảm thiểu

**Hệ quả tích cực:** Dữ liệu nghiệp vụ tập trung, quan hệ rõ ràng, hỗ trợ rollback atomically. Chạy migration có lịch sử Git; cơ chế compare-and-update phát hiện request dùng phiên bản tồn kho đã cũ. Cờ `ingredientsReserved` cùng `OrderIngredient` giúp biết chính xác nguyên liệu đã giữ để phục vụ hoàn kho.

**Hệ quả và hạn chế:** Khi nhiều yêu cầu dùng cùng một nguyên liệu, request đến sau có thể nhận `409 Conflict` hoặc lỗi nghiệp vụ thiếu hàng `400 Bad Request` (tùy trường hợp); frontend cần giữ giỏ và hướng dẫn thử lại. Nếu thao tác gồm nhiều nguyên liệu, mọi cập nhật phải được gói trong transaction và kiểm soát thứ tự thao tác. Migration production có thể không tương thích ngược nếu thay đổi phá vỡ schema cũ; cần review SQL và kế hoạch rollback/backup. Khi kết nối DB bị lỗi, API cần nhận diện lỗi tại health/readiness và ghi log an toàn.

**Giảm thiểu:**

- Sắp xếp nguyên liệu theo ID khi cập nhật để giảm rủi ro vòng chờ khóa; không giữ transaction trong lúc chờ callback VNPay.
- Dùng ràng buộc `stock >= ...` và `version` đồng thời; rollback nếu `count !== 1`.
- Viết integration test cho tình huống tổng tồn kho chỉ đủ **một** trong **năm** request tranh chấp; yêu cầu tối đa một request đặt thành công, bốn yêu cầu còn lại thất bại an toàn, stock không âm, không tạo đơn lỗi.
- Không tự retry vô hạn; chỉ retry ngắn, có giới hạn và kiểm tra idempotency ở nghiệp vụ đặt/thanh toán khi cần.
- Chạy migration production qua bước CI/CD/Render phù hợp gói dịch vụ; sao lưu và thử trên staging trước khi thay đổi schema lớn.
- Phân biệt trạng thái: `GET /health` (FR-12, NFR-07), cấu hình readiness trên Render và logging chuẩn hóa là **phần bổ sung trong Assignment 2**.

## 5. Truy vết, tiêu chí kiểm chứng và quyết định tiếp theo

| Mã FR/NFR | Truy vết quyết định ADR-005 | Tiêu chí kiểm chứng |
|---|---|---|
| **FR-03**, AC-03.3 | Giỏ rỗng không được tạo đơn; backend là nguồn kiểm tra cuối cùng | `POST /orders` giỏ rỗng bị từ chối |
| **FR-04**, AC-04.2 | `User.email @unique` bảo toàn tính duy nhất tài khoản | Đăng ký email trùng không tạo bản ghi |
| **FR-05**, AC-05.3–05.6 | DB transaction + `Ingredient.version` + `stock >= quantity` | Rollback toàn bộ khi thiếu kho; 5 yêu cầu tranh chấp/1 suất thì đúng 1 thành công, 4 từ chối an toàn |
| **FR-06**, AC-06.2–06.3 và 06.6 | `Payment.idempotencyKey @unique`; cập nhật DB theo mỗi sự kiện đã xác thực | IPN lặp lại không nhân đôi Payment/loyalty/hoàn kho |
| **FR-08**, AC-08.3–08.4 | Cập nhật trạng thái và hoàn kho atomically, dùng `OrderIngredient` và `ingredientsReserved` | Không hoàn kho hai lần khi hủy/thất bại/retry |
| **FR-12** | Prisma migration và seed dữ liệu mẫu ở test; thiết kế health trong Mục 5 | **Bổ sung/kiểm chứng Assignment 2**: DB test tái tạo an toàn; endpoint `GET /health` có phản hồi |
| **NFR-01**, AC-NFR-01.2–01.3 | Kiểm soát race condition với optimistic locking | Không stock âm, không đơn dư, lỗi conflict có cấu trúc |
| **NFR-02**, AC-NFR-02.2 | Không hardcode/secrets DB trong code | Không commit `DATABASE_URL`/secret thật hoặc in log |
| **NFR-04**, AC-NFR-04.2–04.4 | Migration/seed tái tạo môi trường, PostgreSQL lưu dữ liệu bền vững | Có README, Compose và bằng chứng kiểm thử trên A2 |
| **NFR-05** | Giao dịch và rollback bảo đảm toàn vẹn Order/OrderItem/stock và Payment trong từng bước xử lý nội bộ | Kiểm tra DB sau các tình huống thất bại |
| **NFR-07** | Health + logging cảnh báo lỗi vận hành, tránh lộ dữ liệu nhạy cảm | **Bổ sung Assignment 2**: test health, log và che secrets |
