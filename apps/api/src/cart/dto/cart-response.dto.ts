import { Expose, Type } from 'class-transformer';

class CartItemResponseDto {
  @Expose()
  id!: string;

  @Expose()
  productId!: string;

  @Expose()
  productName!: string;

  @Expose()
  size!: string;

  @Expose()
  topping?: string | null;

  @Expose()
  quantity!: number;

  @Expose()
  unitPrice!: number;

  @Expose()
  subtotal!: number;
}

export class CartResponseDto {
  @Expose()
  id!: string;

  @Expose()
  userId!: number;

  @Expose()
  @Type(() => CartItemResponseDto)
  items!: CartItemResponseDto[];

  @Expose()
  totalAmount!: number;

  @Expose()
  totalItems!: number;
}
