export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000'
).replace(/\/+$/, '');

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
  availableBySize?: {
    DEFAULT: number;
    S: number;
    M: number;
    L: number;
  };
}

export interface BackendCartItem {
  id: string;
  productId: number;
  productName: string;
  size: string;
  topping: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface BackendCart {
  id: string;
  userId: number;
  items: BackendCartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface BackendOrderItem {
  id: number;
  orderId: number;
  productId: number;
  size?: string | null;
  qty: number;
  lineTotal: number;
  product: {
    id: number;
    name: string;
    price: number;
    imageUrl?: string | null;
  };
}

export interface BackendOrderDetail {
  id: number;
  userId: number;
  status:
    | 'PENDING'
    | 'PAID'
    | 'PREPARING'
    | 'READY'
    | 'COMPLETED'
    | 'CANCELLED'
    | 'PAYMENT_FAILED';
  total: number;
  subtotal: number;
  discountAmount: number;
  createdAt: string;
  paymentFailedAt?: string | null;
  cancelledAt?: string | null;
  note?: string | null;
  items: BackendOrderItem[];
}

export interface PromotionRule {
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number | null;
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('token');
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('token');
}

function getAuthHeader(): Record<string, string> {
  const token = getStoredToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function parseErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data: unknown = await res.json();
    if (typeof data === 'object' && data !== null && 'message' in data) {
      const msg = (data as { message?: unknown }).message;
      if (Array.isArray(msg)) return msg.join(', ');
      if (typeof msg === 'string' && msg.trim()) return msg;
    }
  } catch {
    // Ignore non-JSON error body
  }
  return fallback;
}

async function requestJson<T>(
  path: string,
  options: RequestInit = {},
  fallbackError = 'Đã xảy ra lỗi khi gọi máy chủ',
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, options);

  if (!res.ok) {
    const message = await parseErrorMessage(res, fallbackError);
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await requestJson<unknown>(
    '/products',
    { cache: 'no-store' },
    'Không thể tải menu',
  );

  if (Array.isArray(data)) {
    return data as Product[];
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray((data as { data: unknown }).data)
  ) {
    return (data as { data: Product[] }).data;
  }

  throw new Error('Dữ liệu menu không hợp lệ');
}

export const getProducts = fetchProducts;

// ===== CART APIs (PostgreSQL) =====

export async function fetchCartApi(): Promise<BackendCart> {
  return requestJson<BackendCart>(
    '/cart',
    {
      method: 'GET',
      cache: 'no-store',
      headers: { ...getAuthHeader() },
    },
    'Không thể tải giỏ hàng',
  );
}

export async function addCartItemApi(payload: {
  productId: number;
  size: string;
  toppings: string[];
  quantity: number;
}): Promise<BackendCart> {
  return requestJson<BackendCart>(
    '/cart/items',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(payload),
    },
    'Không thể thêm sản phẩm vào giỏ hàng',
  );
}

export async function updateCartItemApi(
  itemId: string,
  quantity: number,
): Promise<BackendCart> {
  return requestJson<BackendCart>(
    '/cart/items',
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ itemId, quantity }),
    },
    'Không thể cập nhật số lượng sản phẩm',
  );
}

export async function removeCartItemApi(itemId: string): Promise<BackendCart> {
  return requestJson<BackendCart>(
    `/cart/items/${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    },
    'Không thể xóa sản phẩm khỏi giỏ hàng',
  );
}

export async function clearCartApi(): Promise<void> {
  await requestJson<void>(
    '/cart',
    {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    },
    'Không thể xóa toàn bộ giỏ hàng',
  );
}

// ===== ORDER & PROMOTION APIs =====

export async function fetchPromotionApi(code: string): Promise<PromotionRule> {
  return requestJson<PromotionRule>(
    `/promotions/${encodeURIComponent(code)}`,
    { cache: 'no-store' },
    `Lỗi truy xuất mã "${code}"`,
  );
}

export async function createOrder(
  items: { productId: number; qty: number; size?: string; toppings?: string[] }[],
  promotionCode?: string,
): Promise<BackendOrderDetail> {
  return requestJson<BackendOrderDetail>(
    '/orders',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ items, promotionCode }),
    },
    'Lỗi khi tạo đơn hàng',
  );
}

export async function createOrderFromCart(
  promotionCode?: string,
): Promise<BackendOrderDetail> {
  return requestJson<BackendOrderDetail>(
    '/orders/from-cart',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify(promotionCode ? { promotionCode } : {}),
    },
    'Không thể tạo đơn hàng từ giỏ hàng',
  );
}

export async function fetchOrderById(orderId: number): Promise<BackendOrderDetail> {
  return requestJson<BackendOrderDetail>(
    `/orders/${orderId}`,
    {
      method: 'GET',
      cache: 'no-store',
      headers: { ...getAuthHeader() },
    },
    'Không thể tải chi tiết đơn hàng',
  );
}

export async function updateOrderStatus(
  orderId: number,
  status: BackendOrderDetail['status'],
): Promise<BackendOrderDetail> {
  return requestJson<BackendOrderDetail>(
    `/orders/${orderId}/status`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ status }),
    },
    'Không thể cập nhật trạng thái đơn hàng',
  );
}

// ===== PAYMENT APIs =====

function generateIdempotencyKey(prefix: string, orderId: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${prefix}-${orderId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function processPayment(orderId: number, method: 'WALLET' | 'CARD') {
  return requestJson<{
    orderId: number;
    method: string;
    status: string;
    message: string;
  }>(
    '/payments',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey('pay', orderId),
        ...getAuthHeader(),
      },
      body: JSON.stringify({ orderId, method }),
    },
    'Giao dịch thanh toán thất bại.',
  );
}

export async function createVnpayPayment(orderId: number): Promise<string> {
  const data = await requestJson<
    string | { paymentUrl?: string; url?: string; message?: string }
  >(
    '/payments/vnpay/create',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': generateIdempotencyKey('vnpay', orderId),
        ...getAuthHeader(),
      },
      body: JSON.stringify({ orderId }),
    },
    'Không thể tạo cổng thanh toán VNPay',
  );

  const paymentUrl =
    typeof data === 'string' ? data : data.paymentUrl || data.url;

  if (!paymentUrl) {
    throw new Error('Backend không trả về link thanh toán VNPay hợp lệ');
  }

  return paymentUrl;
}