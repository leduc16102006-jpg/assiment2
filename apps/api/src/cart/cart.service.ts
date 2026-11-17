import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { ICart, ICartItem } from './interfaces/cart.interface';
import { CART_ERRORS } from './cart.constants';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getCart(userId: number): Promise<ICart> {
    const cart = await this.prisma.cart.upsert({
      where: { userId },
      create: { userId },
      update: {},
      include: { items: true },
    });

    return this.mapToCartInterface(cart);
  }

  async addItem(userId: number, dto: AddToCartDto): Promise<ICart> {
    if (dto.quantity <= 0) {
      throw new BadRequestException(CART_ERRORS.INVALID_QUANTITY);
    }

    const cart = await this.getCart(userId);
    const subtotal = dto.unitPrice * dto.quantity;

    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId: dto.productId,
        size: dto.size,
        topping: dto.topping ?? null,
      },
    });

    if (existingItem) {
      const newQty = existingItem.quantity + dto.quantity;
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQty,
          subtotal: dto.unitPrice * newQty,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: dto.productId,
          productName: dto.productName,
          size: dto.size,
          topping: dto.topping,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          subtotal,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateItem(userId: number, dto: UpdateCartItemDto): Promise<ICart> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
    });
    if (!cart) throw new NotFoundException(CART_ERRORS.CART_NOT_FOUND);

    const item = await this.prisma.cartItem.findFirst({
      where: { id: dto.itemId, cartId: cart.id },
    });
    if (!item) throw new NotFoundException(CART_ERRORS.ITEM_NOT_FOUND);

    if (dto.quantity !== undefined) {
      if (dto.quantity <= 0) {
        await this.prisma.cartItem.delete({ where: { id: dto.itemId } });
      } else {
        await this.prisma.cartItem.update({
          where: { id: dto.itemId },
          data: {
            quantity: dto.quantity,
            subtotal: item.unitPrice * dto.quantity,
          },
        });
      }
    }

    return this.getCart(userId);
  }

  async removeItem(userId: number, itemId: string): Promise<ICart> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException(CART_ERRORS.CART_NOT_FOUND);

    await this.prisma.cartItem.deleteMany({
      where: { id: itemId, cartId: cart.id },
    });

    return this.getCart(userId);
  }

  async clearCart(userId: number): Promise<void> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (cart) {
      await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  async isEmpty(userId: number): Promise<boolean> {
    const cart = await this.getCart(userId);
    return cart.items.length === 0;
  }

  private mapToCartInterface(cart: any): ICart {
    const items = cart.items || [];
    const totalAmount = items.reduce((sum, i) => sum + (i.subtotal || 0), 0);
    const totalItems = items.reduce((sum, i) => sum + (i.quantity || 0), 0);

    return {
      id: cart.id,
      userId: cart.userId,
      items,
      totalAmount,
      totalItems,
    };
  }
}
