const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

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

function getAuthHeader(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem("accessToken") || localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// Giữ nguyên hàm fetchProducts của Bạn D từ Sprint 1
export async function fetchProducts(): Promise<Product[]> {
  const response = await fetch(`${API_URL}/products`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error('Không thể tải menu');
  }

  const data: unknown = await response.json();

  if (Array.isArray(data)) {
    return data as Product[];
  }

  if (
    typeof data === 'object' &&
    data !== null &&
    'data' in data &&
    Array.isArray(data.data)
  ) {
    return data.data as Product[];
  }

  throw new Error('Dữ liệu menu không hợp lệ');
}

// Alias để tương thích với các component gọi getProducts
export const getProducts = fetchProducts;

export async function createOrder(
  items: { productId: number; qty: number; size?: string; toppings?: string[] }[],
  promotionCode?: string
) {
  const payload: { items: typeof items; promotionCode?: string } = { items };

  if (promotionCode && promotionCode.trim()) {
    payload.promotionCode = promotionCode.trim().toUpperCase();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeader(),
  };

  const res = await fetch(`${API_URL}/orders`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Tạo đơn hàng thất bại.");
  }
  return data;
}

export async function processPayment(orderId: number, method: "WALLET" | "CARD") {
  const idempotencyKey =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `idem-${orderId}-${Date.now()}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Idempotency-Key": idempotencyKey,
    ...getAuthHeader(),
  };

  const res = await fetch(`${API_URL}/payments`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      orderId,
      method,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || "Giao dịch thanh toán thất bại.");
  }
  return data;
}