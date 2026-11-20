import { BadRequestException } from '@nestjs/common';

const SIZE_EXTRA: Readonly<Record<string, number>> = {
  DEFAULT: 0,
  S: 0,
  M: 5000,
  L: 10000,
};

const TOPPING_PRICES: Readonly<Record<string, number>> = {
  'Trân châu': 7000,
  'Kem cheese': 10000,
  'Extra shot': 10000,
};

export function parseToppings(toppingText?: string | null): string[] {
  if (!toppingText?.trim()) {
    return [];
  }

  return toppingText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function normalizeToppings(
  toppings?: string[],
  legacyTopping?: string,
): string[] {
  if (toppings !== undefined && legacyTopping?.trim()) {
    throw new BadRequestException(
      'Chỉ truyền toppings hoặc topping, không truyền đồng thời cả hai',
    );
  }

  const rawList =
    toppings !== undefined ? toppings : parseToppings(legacyTopping);

  const normalized = rawList.map((item) => item.trim());

  if (normalized.some((item) => !item)) {
    throw new BadRequestException('Tên topping không được để trống');
  }

  if (new Set(normalized).size !== normalized.length) {
    throw new BadRequestException('Không được chọn topping trùng lặp');
  }

  for (const topping of normalized) {
    if (TOPPING_PRICES[topping] === undefined) {
      throw new BadRequestException(`Topping không hợp lệ: ${topping}`);
    }
  }

  return [...normalized].sort();
}

export function serializeToppings(toppings: string[]): string {
  return toppings.join(', ');
}

export function calculateUnitPrice(
  basePrice: number,
  size?: string,
  toppings: string[] = [],
): number {
  if (!Number.isSafeInteger(basePrice) || basePrice < 0) {
    throw new BadRequestException('Giá sản phẩm không hợp lệ');
  }

  const normalizedSize = (size || 'DEFAULT').trim().toUpperCase();
  const sizeExtra = SIZE_EXTRA[normalizedSize];

  if (sizeExtra === undefined) {
    throw new BadRequestException(`Size không hợp lệ: ${size}`);
  }

  const normalizedToppings = normalizeToppings(toppings);
  let totalPrice = basePrice + sizeExtra;

  for (const topping of normalizedToppings) {
    totalPrice += TOPPING_PRICES[topping];
  }

  if (!Number.isSafeInteger(totalPrice)) {
    throw new BadRequestException('Tổng giá sản phẩm không hợp lệ');
  }

  return totalPrice;
}