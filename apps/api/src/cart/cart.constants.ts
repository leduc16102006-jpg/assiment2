export const CART_CACHE = {
  PREFIX: 'cart:',
  TTL: 86400, // Thời gian sống cache: 24 giờ (tính bằng giây)
};

export const CART_ERRORS = {
  CART_NOT_FOUND: 'Giỏ hàng không tồn tại',
  ITEM_NOT_FOUND: 'Món ăn không có trong giỏ hàng',
  INVALID_QUANTITY: 'Số lượng phải lớn hơn 0',
  EMPTY_CART: 'Giỏ hàng đang trống, vui lòng chọn món trước khi đặt hàng',
};

export const CART_MESSAGES = {
  CART_EMPTY: 'Giỏ hàng của bạn đang trống',
  BACK_TO_MENU: 'Quay lại Menu để chọn món',
  PAYMENT_FAILED: 'Thanh toán thất bại — giỏ hàng được giữ nguyên, bạn có thể thử lại',
};
