
import { BadRequestException } from '@nestjs/common';

const SIZE_EXTRA: Readonly<Record<string, number>> = {
  DEFAULT: 0,
  S: 0,
  M: 5000,
  L: 10000,
};

const TOPPING_PRICES: Readonly<Record<string, number>> = {
  'Trân châu': 5000,
  'Thạch': 5000,
  'Kem cheese': 10000,
  'Extra shot': 10000,
};

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

  const normalizedToppings = toppings.map((item) => item.trim());

  if (normalizedToppings.some((item) => !item)) {
    throw new BadRequestException('Tên topping không được để trống');
  }

  if (new Set(normalizedToppings).size !== normalizedToppings.length) {
    throw new BadRequestException('Không được chọn topping trùng lặp');
  }

  let totalPrice = basePrice + sizeExtra;

  for (const topping of normalizedToppings) {
    const toppingPrice = TOPPING_PRICES[topping];

    if (toppingPrice === undefined) {
      throw new BadRequestException(`Topping không hợp lệ: ${topping}`);
    }

    totalPrice += toppingPrice;
  }

  if (!Number.isSafeInteger(totalPrice)) {
    throw new BadRequestException('Tổng giá sản phẩm không hợp lệ');
  }

  return totalPrice;
}
