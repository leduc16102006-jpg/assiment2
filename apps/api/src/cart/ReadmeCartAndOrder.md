# README – CART & ORDER MANAGEMENT

## 1. Tổng quan

Phát triển và tích hợp chức năng giỏ hàng (Cart) và quản lý đơn hàng (Order) cho hệ thống BrewLite sử dụng NestJS, Prisma ORM và PostgreSQL.

Các chức năng chính:

- Quản lý giỏ hàng của người dùng.
- Thêm, sửa, xóa sản phẩm trong giỏ hàng.
- Tính giá sản phẩm theo size và topping.
- Tạo đơn hàng trực tiếp hoặc từ giỏ hàng.
- Áp dụng mã khuyến mãi.
- Kiểm tra và giữ nguyên liệu khi tạo đơn.
- Hoàn trả nguyên liệu khi đơn hàng bị hủy hoặc thanh toán thất bại.
- Quản lý trạng thái đơn hàng theo State Machine.
- Tự động hủy đơn hàng quá thời hạn thanh toán.

## 2. Công nghệ sử dụng

| Công nghệ | Vai trò |
|---|---|
| NestJS | Xây dựng REST API |
| TypeScript | Ngôn ngữ lập trình |
| Prisma ORM | Truy vấn và quản lý database |
| PostgreSQL | Cơ sở dữ liệu |
| class-validator | Kiểm tra dữ liệu đầu vào |
| class-transformer | Chuyển đổi dữ liệu DTO |
| Swagger | Tài liệu và kiểm thử API |
| Jest | Unit Test |

## 3. Chức năng giỏ hàng (Cart)

### 3.1. Quản lý giỏ hàng

Triển khai `CartService` với các chức năng:

- Lấy giỏ hàng của người dùng.
- Tự động tạo giỏ hàng nếu người dùng chưa có.
- Thêm sản phẩm vào giỏ hàng.
- Cập nhật số lượng sản phẩm.
- Xóa một sản phẩm khỏi giỏ hàng.
- Xóa toàn bộ sản phẩm trong giỏ hàng.
- Kiểm tra giỏ hàng có sản phẩm hay không.

### 3.2. Xử lý sản phẩm trong giỏ hàng

Thông tin mỗi CartItem bao gồm:

| Thuộc tính | Mô tả |
|---|---|
| id | ID của CartItem |
| cartId | ID giỏ hàng |
| productId | ID sản phẩm |
| productName | Tên sản phẩm |
| size | Kích cỡ sản phẩm |
| topping | Topping được chọn |
| quantity | Số lượng |
| unitPrice | Đơn giá |
| subtotal | Thành tiền |

Công thức:

`subtotal = unitPrice × quantity`

Các kiểm tra được triển khai:

- Số lượng phải là số nguyên dương.
- Sản phẩm phải tồn tại.
- Giá sản phẩm không được âm.
- Size phải hợp lệ.
- Topping phải hợp lệ.
- Không cho phép tạo dữ liệu có tổng tiền vượt giới hạn số nguyên an toàn.

### 3.3. Tránh tạo dòng sản phẩm trùng lặp

Các sản phẩm có cùng:

- Cart ID.
- Product ID.
- Size.
- Topping.

Sẽ được cập nhật số lượng trên CartItem hiện có thay vì tạo thêm dòng mới.

## 4. Tính giá sản phẩm (Product Pricing)

Xây dựng hàm dùng chung:

`calculateUnitPrice()`

Đặt tại:

`src/shared/pricing/product-pricing.ts`

Hàm tính giá dựa trên:

- Giá gốc sản phẩm.
- Phụ phí size.
- Phụ phí topping.

Bảng phụ phí đang cấu hình:

| Thành phần | Phụ phí |
|---|---:|
| DEFAULT | 0đ |
| S | 0đ |
| M | 5.000đ |
| L | 10.000đ |
| Trân châu | 5.000đ |
| Thạch | 5.000đ |
| Kem cheese | 10.000đ |
| Extra shot | 10.000đ |

Công thức:

`Unit Price = Base Price + Size Extra + Topping Price`

Hàm được sử dụng chung giữa Cart và Order để hạn chế sai lệch trong quá trình tính giá.

## 5. Chức năng tạo đơn hàng (Order)

### 5.1. Tạo đơn hàng trực tiếp

API:

`POST /orders`

Cho phép người dùng gửi danh sách sản phẩm để tạo đơn hàng.

DTO:

- `CreateOrderDto`
- `CreateOrderItemDto`

Thông tin sản phẩm:

- productId
- qty
- size
- toppings

Thông tin khuyến mãi:

- promotionCode (không bắt buộc)

### 5.2. Tạo đơn hàng từ giỏ hàng

API:

`POST /orders/from-cart`

DTO:

`CreateOrderFromCartDto`

Luồng xử lý:

1. Lấy giỏ hàng của người dùng.
2. Kiểm tra giỏ hàng có sản phẩm.
3. Chuyển CartItem thành dữ liệu tạo đơn hàng.
4. Xóa các CartItem đã được đọc.
5. Tính lại giá sản phẩm từ database.
6. Kiểm tra khuyến mãi.
7. Tính nguyên liệu cần thiết.
8. Giữ nguyên liệu trong kho.
9. Tạo Order và OrderItem.
10. Hoàn tất transaction.

Việc xóa giỏ hàng và tạo đơn được thực hiện trong cùng transaction.

Nếu quá trình tạo đơn thất bại, transaction rollback để khôi phục dữ liệu giỏ hàng.

### 5.3. Tạo đơn hàng dùng chung logic

Hai API tạo đơn sử dụng chung hàm:

`createOrderInTransaction()`

Mục đích:

- Tránh lặp code.
- Đồng nhất quy trình tính giá.
- Đồng nhất quy trình áp dụng khuyến mãi.
- Đồng nhất quy trình giữ nguyên liệu.
- Đảm bảo dữ liệu đơn hàng nhất quán.

## 6. Quản lý khuyến mãi (Promotion)

Tích hợp xử lý mã khuyến mãi trong quá trình tạo đơn hàng.

Các bước kiểm tra:

- Mã khuyến mãi có tồn tại.
- Khuyến mãi đang hoạt động.
- Thời gian hiện tại nằm trong thời hạn áp dụng.
- Tổng tiền đơn hàng đạt giá trị tối thiểu.
- Giới hạn mức giảm tối đa nếu có.

Hỗ trợ hai loại khuyến mãi:

### PERCENT

Giảm theo phần trăm:

`Discount = Subtotal × Promotion Value / 100`

Nếu có `maxDiscount`, mức giảm không vượt quá giới hạn này.

### FIXED

Giảm số tiền cố định theo cấu hình khuyến mãi.

Tổng tiền:

`Total = Subtotal - Discount Amount`

Không cho phép giá trị giảm vượt quá subtotal.

## 7. Quản lý nguyên liệu và tồn kho (Ingredient Inventory)

Xây dựng các hàm xử lý tại:

`src/orders/ingredient-stock.ts`

### 7.1. Tính nguyên liệu cần thiết

Hàm:

`calculateIngredientRequirements()`

Chức năng:

- Lấy công thức nguyên liệu từ RecipeItem.
- Kiểm tra công thức theo sản phẩm và size.
- Lấy công thức topping từ ToppingRecipe.
- Kiểm tra topping có hợp lệ.
- Tính tổng nguyên liệu theo số lượng sản phẩm.
- Gộp các nguyên liệu trùng nhau.
- Sắp xếp theo ingredientId.

### 7.2. Giữ nguyên liệu

Hàm:

`reserveIngredients()`

Chức năng:

- Kiểm tra nguyên liệu tồn tại.
- Kiểm tra số lượng cần sử dụng hợp lệ.
- Kiểm tra tồn kho có đủ.
- Trừ tồn kho trong database.
- Tăng version để kiểm soát cập nhật đồng thời.

Sử dụng optimistic locking thông qua điều kiện cập nhật:

- Ingredient ID.
- Version hiện tại.
- Stock phải lớn hơn hoặc bằng số lượng cần giữ.

Nếu cập nhật không thành công, phát sinh lỗi xung đột để tránh overselling nguyên liệu.

### 7.3. Hoàn trả nguyên liệu

Hàm:

`releaseOrderIngredients()`

Chức năng:

- Kiểm tra đơn hàng.
- Kiểm tra nguyên liệu đã được giữ hay chưa.
- Hoàn trả số lượng nguyên liệu vào kho.
- Tăng version.
- Cập nhật `ingredientsReserved = false`.

Cơ chế này giúp tránh hoàn kho nhiều lần cho cùng một đơn hàng.

### 7.4. Giữ lại nguyên liệu khi thử thanh toán lại

Hàm:

`reserveOrderIngredients()`

Khi đơn hàng chuyển từ `PAYMENT_FAILED` về `PENDING`, hệ thống kiểm tra và giữ lại nguyên liệu cần thiết trước khi cho phép tiếp tục thanh toán.

## 8. Quản lý trạng thái đơn hàng (Order State Machine)

Các trạng thái được hỗ trợ:

| Trạng thái hiện tại | Trạng thái tiếp theo hợp lệ |
|---|---|
| PENDING | PAID, PAYMENT_FAILED, CANCELLED |
| PAID | PREPARING, CANCELLED |
| PREPARING | READY |
| READY | COMPLETED |
| COMPLETED | Không có |
| PAYMENT_FAILED | PENDING, CANCELLED |
| CANCELLED | Không có |

Hàm xử lý:

`updateStatus()`

Chức năng:

- Kiểm tra đơn hàng tồn tại.
- Kiểm tra trạng thái hiện tại.
- Kiểm tra trạng thái tiếp theo có hợp lệ.
- Cập nhật trạng thái bằng `updateMany`.
- Kiểm tra số bản ghi được cập nhật.
- Ghi thời gian thanh toán thất bại.
- Xóa thời gian thất bại khi thanh toán thành công.
- Hoàn trả hoặc giữ lại nguyên liệu tùy theo trạng thái.

Không cho phép chuyển trạng thái tùy ý ngoài các quy tắc của State Machine.

## 9. Tự động hủy đơn hàng quá hạn (Cron Job)

Triển khai hai chức năng:

### 9.1. EX-09a: Hủy đơn PENDING quá 15 phút

Hàm:

`cancelExpiredPendingOrders()`

Quy trình:

1. Tìm đơn hàng PENDING quá thời hạn.
2. Kiểm tra lại trạng thái trước khi hủy.
3. Chuyển đơn hàng sang CANCELLED.
4. Ghi thời gian hủy.
5. Ghi lý do hủy.
6. Hoàn trả nguyên liệu đã giữ.
7. Ghi log kết quả.

### 9.2. EX-09b: Hủy đơn PAYMENT_FAILED quá 15 phút

Hàm:

`cancelExpiredPaymentFailedOrders()`

Quy trình:

1. Tìm đơn PAYMENT_FAILED quá thời hạn.
2. Kiểm tra lại trạng thái và thời gian thất bại.
3. Chuyển đơn sang CANCELLED.
4. Ghi thời gian hủy.
5. Ghi lý do hủy.
6. Hoàn trả nguyên liệu đã giữ.
7. Ghi log kết quả.

Các thao tác cập nhật trạng thái và hoàn kho được thực hiện trong transaction.

## 10. API quản lý đơn hàng

| Method | Endpoint | Chức năng |
|---|---|---|
| POST | `/orders` | Tạo đơn hàng trực tiếp |
| POST | `/orders/from-cart` | Tạo đơn hàng từ giỏ hàng |
| GET | `/orders/me` | Lấy lịch sử đơn hàng của người dùng |
| GET | `/orders/:id` | Xem chi tiết đơn hàng |
| PATCH | `/orders/:id/status` | Cập nhật trạng thái đơn hàng |

Các API được bảo vệ bằng `JwtAuthGuard` theo cấu hình hiện tại.

## 11. Transaction và xử lý lỗi

Các nghiệp vụ quan trọng được thực hiện trong Prisma Transaction:

- Tạo đơn hàng.
- Tạo OrderItem.
- Giữ nguyên liệu.
- Ghi nhận nguyên liệu sử dụng.
- Xóa CartItem khi checkout.
- Cập nhật trạng thái và hoàn kho.

Các lỗi được xử lý bao gồm:

- Giỏ hàng trống.
- Sản phẩm không tồn tại.
- Số lượng không hợp lệ.
- Size không hợp lệ.
- Topping không hợp lệ.
- Topping bị trùng.
- Mã khuyến mãi không hợp lệ.
- Không đủ nguyên liệu.
- Cập nhật tồn kho đồng thời.
- Chuyển trạng thái đơn hàng không hợp lệ.
- Giỏ hàng bị thay đổi trong quá trình checkout.

## 12. Kiểm thử

Sử dụng Jest để kiểm thử backend.

Các nội dung cần kiểm thử:

- Khởi tạo OrdersController.
- Gọi các API của OrdersController.
- Tạo đơn hàng trực tiếp.
- Tạo đơn hàng từ giỏ hàng.
- Kiểm tra giỏ hàng trống.
- Kiểm tra tính giá sản phẩm.
- Kiểm tra mã khuyến mãi.
- Kiểm tra giữ nguyên liệu.
- Kiểm tra hoàn trả nguyên liệu.
- Kiểm tra State Machine.
- Kiểm tra tự động hủy đơn hàng.
- Kiểm tra xử lý nhiều request đồng thời.

### Kiểm thử cạnh tranh tồn kho

Tình huống đã thực hiện:

- Tồn kho nguyên liệu ban đầu: 100.
- Mỗi đơn cần: 80.
- Có 5 request đồng thời.

Kết quả kỳ vọng:

- Chỉ một request giữ kho thành công.
- Các request còn lại bị từ chối do không đủ tồn kho hoặc xung đột cập nhật.
- Tồn kho cuối cùng: 20.
- Không xảy ra tình trạng overselling.

**Lưu ý:** Cần chạy lại toàn bộ test sau khi tích hợp các thay đổi cuối cùng để xác nhận kết quả thực tế.

## 13. Cấu trúc file liên quan

```text
src/
├── cart/
│   ├── dto/
│   │   ├── add-to-cart.dto.ts
│   │   └── update-cart-item.dto.ts
│   ├── interfaces/
│   │   └── cart.interface.ts
│   ├── cart.controller.ts
│   ├── cart.service.ts
│   └── cart.module.ts
│
├── orders/
│   ├── dto/
│   │   ├── create-order.dto.ts
│   │   ├── create-order-from-cart.dto.ts
│   │   └── update-order-status.dto.ts
│   ├── ingredient-stock.ts
│   ├── orders.controller.ts
│   ├── orders.service.ts
│   └── orders.module.ts
│
└── shared/
    └── pricing/
        └── product-pricing.ts
```

## 14. Kết luận

Đã xây dựng và tích hợp các nghiệp vụ chính của Cart và Order trong BrewLite:

- Quản lý giỏ hàng.
- Tính giá theo size và topping.
- Tạo đơn hàng trực tiếp và từ giỏ hàng.
- Áp dụng khuyến mãi.
- Quản lý nguyên liệu và tồn kho.
- Chống cập nhật tồn kho vượt quá số lượng cho phép bằng optimistic locking.
- Quản lý trạng thái đơn hàng bằng State Machine.
- Hoàn trả nguyên liệu khi đơn hàng bị hủy hoặc thanh toán thất bại.
- Tự động hủy đơn hàng quá hạn bằng các tác vụ Cron.

Các chức năng được tổ chức thành những module riêng biệt, sử dụng transaction để bảo đảm tính nhất quán dữ liệu và thuận tiện cho việc mở rộng hệ thống.

**Phạm vi README:** Tập trung vào Cart, Order, Pricing và Ingredient Inventory; không bao gồm triển khai phân quyền ADMIN mới.
