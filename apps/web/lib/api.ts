const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl?: string | null;
  stock: number;
  version: number;
}

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