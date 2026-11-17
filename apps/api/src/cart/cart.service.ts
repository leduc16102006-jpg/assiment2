
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ICart, ICartItem } from './interfaces/cart.interface';
import { CART_ERRORS } from './cart.constants';
import { Prisma } from '@prisma/client';
import { calculateUnitPrice } from '../shared/pricing/product-pricing';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  // Lấy giỏ hàng, nếu chưa có thì tạo mới
  async getCart(userId: number): Promise<ICart> {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: {
        items: {
          orderBy: { id: 'asc' },
        },
      },
    });

    return this.mapToCartInterface(cart);
  }

  // Thêm sản phẩm vào giỏ
  async addItem(
    userId: number,
    dto: AddToCartDto,
  ): Promise<ICart> {
    if (!Number.isInteger(dto.quantity) || dto.quantity <= 0) {
      throw new BadRequestException(CART_ERRORS.INVALID_QUANTITY);
    }

    const size = dto.size.trim().toUpperCase();
    const topping = dto.topping?.trim() || '';

    if (!['DEFAULT', 'S', 'M', 'L'].includes(size)) {
      throw new BadRequestException('Kích thước sản phẩm không hợp lệ');
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        // Kiểm tra sản phẩm trong database
        const product = await tx.product.findUnique({
          where: { id: dto.productId },
        });

        if (!product) {
          throw new NotFoundException('Sản phẩm không tồn tại');
        }

        if (product.price < 0) {
          throw new BadRequestException('Giá sản phẩm không hợp lệ');
        }

        const unitPrice = calculateUnitPrice(product.price, size, topping ? [topping] : []);

        const subtotal = unitPrice * dto.quantity;

        if (!Number.isSafeInteger(subtotal)) {
          throw new BadRequestException('Tổng tiền sản phẩm không hợp lệ');
        }

        //  Tạo hoặc lấy giỏ hàng
        const cart = await tx.cart.upsert({
          where: { userId },
          create: { userId },
          update: {},
        });

        //  Tìm món đã có trong giỏ
        const existingItem = await tx.cartItem.findFirst({
          where: {
            cartId: cart.id,
            productId: product.id,
            size,
            topping,
          },
        });

        if (existingItem) {
          const newQty = existingItem.quantity + dto.quantity;
          const newSubtotal = unitPrice * newQty;

          if (!Number.isSafeInteger(newSubtotal)) {
            throw new BadRequestException('Tổng tiền sản phẩm không hợp lệ');
          }

          await tx.cartItem.update({
            where: { id: existingItem.id },
            data: {
              quantity: newQty,
              productName: product.name,
              unitPrice,
              subtotal: newSubtotal,
            },
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: cart.id,
              productId: product.id,
              productName: product.name,
              size,
              topping,
              quantity: dto.quantity,
              unitPrice,
              subtotal,
            },
          });
        }
      });

      return this.getCart(userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'Sản phẩm đang được thêm đồng thời. Vui lòng thử lại.',
        );
      }

      throw error;
    }
  }

  // Cập nhật số lượng sản phẩm
  async updateItem(
    userId: number,
    dto: UpdateCartItemDto,
  ): Promise<ICart> {
    if (!Number.isInteger(dto.quantity) || dto.quantity < 1) {
      throw new BadRequestException(CART_ERRORS.INVALID_QUANTITY);
    }

    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException(CART_ERRORS.CART_NOT_FOUND);
    }

    const item = await this.prisma.cartItem.findFirst({
      where: {
        id: dto.itemId,
        cartId: cart.id,
      },
    });

    if (!item) {
      throw new NotFoundException(CART_ERRORS.ITEM_NOT_FOUND);
    }

    const subtotal = item.unitPrice * dto.quantity;

    if (!Number.isSafeInteger(subtotal)) {
      throw new BadRequestException('Tổng tiền sản phẩm không hợp lệ');
    }

    await this.prisma.cartItem.updateMany({
      where: {
        id: dto.itemId,
        cartId: cart.id,
      },
      data: {
        quantity: dto.quantity,
        subtotal,
      },
    });

    return this.getCart(userId);
  }

  // Xóa một sản phẩm khỏi giỏ
  async removeItem(
    userId: number,
    itemId: string,
  ): Promise<ICart> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      throw new NotFoundException(CART_ERRORS.CART_NOT_FOUND);
    }

    const result = await this.prisma.cartItem.deleteMany({
      where: {
        id: itemId,
        cartId: cart.id,
      },
    });

    if (result.count === 0) {
      throw new NotFoundException(CART_ERRORS.ITEM_NOT_FOUND);
    }

    return this.getCart(userId);
  }

  // Xóa toàn bộ sản phẩm trong giỏ
  async clearCart(userId: number): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });

    if (!cart) {
      return;
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }

  // Kiểm tra giỏ hàng có trống không
  async isEmpty(userId: number): Promise<boolean> {
    const cart = await this.getCart(userId);
    return cart.items.length === 0;
  }

  // Chuyển dữ liệu Prisma sang ICart
  
private mapToCartInterface(
  cart: Prisma.CartGetPayload<{
    include: {
      items: true;
    };
  }>,
): ICart {
  const items: ICartItem[] = cart.items.map((item) => ({
    id: item.id,
    productId: item.productId,
    productName: item.productName,
    size: item.size,
    topping: item.topping,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.subtotal,
  }));

  const totalAmount = items.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0,
  );

  return {
    id: cart.id,
    userId: cart.userId,
    items,
    totalAmount,
    totalItems,
  };
}
}
