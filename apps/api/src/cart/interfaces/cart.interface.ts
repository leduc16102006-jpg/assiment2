export interface ICartItem {
  id: string;
  productId: string;
  productName: string;
  size: string;
  topping?: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface ICart {
  id: string;
  userId: number;
  items: ICartItem[];
  totalAmount: number;
  totalItems: number;
}
