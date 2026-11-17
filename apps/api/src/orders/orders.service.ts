import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  calculateIngredientRequirements,
  releaseOrderIngredients,
  reserveIngredients,
  reserveOrderIngredients,
} from './ingredient-stock';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrderStatus } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(private readonly prisma: PrismaService) {}

  private readonly allowedTransitions: Readonly<Record<
    OrderStatus,
    readonly OrderStatus[]
  >> = {
    PENDING: ['PAID', 'PAYMENT_FAILED', 'CANCELLED'],
    PAID: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY'],
    READY: ['COMPLETED'],
    COMPLETED: [],
    PAYMENT_FAILED: ['PENDING', 'CANCELLED'],
    CANCELLED: [],
  };

  async create(userId: number, dto: CreateOrderDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm');
    }

    // Ngăn trùng lặp sản phẩm (bao gồm Size + Topping)
    const itemKeys = dto.items.map(
      (item) =>
        `${item.productId}_${item.size || 'DEFAULT'}_${(item.toppings ?? []).sort().join(',') || 'NONE'}`,
    );
    if (new Set(itemKeys).size !== itemKeys.length) {
      throw new BadRequestException(
        'Sản phẩm cùng kích cỡ và topping không được lặp lại, vui lòng tăng số lượng',
      );
    }

    const uniqueProductIds = [...new Set(dto.items.map((item) => item.productId))];

    return this.prisma.$transaction(
      async (tx) => {
        // Kiểm tra người dùng
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!user) throw new UnauthorizedException('Tài khoản không tồn tại');

        // Kiểm tra sản phẩm tồn tại
        const products = await tx.product.findMany({
          where: { id: { in: uniqueProductIds } },
        });
        if (products.length !== uniqueProductIds.length) {
          throw new NotFoundException('Một hoặc nhiều sản phẩm không tồn tại');
        }
        const productMap = new Map(products.map((p) => [p.id, p]));

        // Tính tiền từng dòng
        let subtotal = 0;
        const orderItems = dto.items.map((item) => {
          const product = productMap.get(item.productId);
          if (!product) throw new NotFoundException('Sản phẩm không tồn tại');

          let unitPrice = Number(product.price);

          // Phụ thu kích cỡ
          if (item.size === 'M') unitPrice += 5000;
          if (item.size === 'L') unitPrice += 10000;

          // Phụ thu topping
          const toppingPrices: Readonly<Record<string, number>> = {
            'Trân châu': 7000,
            'Extra shot': 10000,
            'Kem cheese': 10000,
          };
          const toppings: string[] = item.toppings ?? [];
          let toppingStr = '';
          if (toppings.length > 0) {
            toppings.forEach((t) => {
              if (toppingPrices[t]) unitPrice += toppingPrices[t];
            });
            toppingStr = ` (+ ${toppings.join(', ')})`;
          }

          const lineTotal = unitPrice * item.qty;
          subtotal += lineTotal;

          const savedSize = item.size
            ? `${item.size}${toppingStr}`
            : toppings.length > 0
              ? toppings.join(', ')
              : null;

          return {
            productId: product.id,
            qty: item.qty,
            size: savedSize,
            lineTotal,
          };
        });

        // Áp dụng mã khuyến mãi
        let promotionId: number | null = null;
        let discountAmount = 0;

        if (dto.promotionCode?.trim()) {
          const code = dto.promotionCode.trim().toUpperCase();
          const promotion = await tx.promotion.findUnique({ where: { code } });

          if (!promotion) throw new BadRequestException('Mã khuyến mãi không tồn tại');

          const now = new Date();
          if (
            !promotion.isActive ||
            now < promotion.startsAt ||
            now > promotion.expiresAt
          ) {
            throw new BadRequestException('Mã khuyến mãi không hoạt động hoặc đã hết hạn');
          }
          if (subtotal < promotion.minOrderAmount) {
            throw new BadRequestException(
              `Đơn hàng phải đạt tối thiểu ${promotion.minOrderAmount.toLocaleString('vi-VN')} đồng`,
            );
          }

          if (promotion.type === 'PERCENT') {
            discountAmount = Math.floor((subtotal * promotion.value) / 100);
            if (promotion.maxDiscount !== null) {
              discountAmount = Math.min(discountAmount, promotion.maxDiscount);
            }
          } else {
            discountAmount = promotion.value;
          }
          discountAmount = Math.min(discountAmount, subtotal);
          promotionId = promotion.id;
        }

        const total = Math.max(0, subtotal - discountAmount);

        // Tính & giữ nguyên liệu
        const requirements = await calculateIngredientRequirements(tx, dto.items);
        await reserveIngredients(tx, requirements);

        // Tạo đơn hàng
        return tx.order.create({
          data: {
            userId,
            subtotal,
            discountAmount,
            promotionId,
            total,
            status: 'PENDING',
            ingredientsReserved: true,
            items: { create: orderItems },
            ingredientUses: {
              create: requirements.map((r) => ({
                ingredientId: r.ingredientId,
                quantity: r.quantity,
              })),
            },
          },
          include: {
            items: { include: { product: true } },
            ingredientUses: { include: { ingredient: true } },
          },
        });
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  async updateStatus(orderId: number, nextStatus: OrderStatus) {
    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { select: { productId: true, qty: true } } },
      });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      const currentStatus = order.status as OrderStatus;
      const allowed = this.allowedTransitions[currentStatus] ?? [];
      if (!allowed.includes(nextStatus)) {
        throw new BadRequestException(
          `Không thể chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`,
        );
      }

      // Ghi thời gian khi chuyển sang PAYMENT_FAILED
      const updateData: any = { status: nextStatus };
      if (nextStatus === 'PAYMENT_FAILED') {
        updateData.paymentFailedAt = new Date();
      }
      // Xóa thời gian thất bại nếu thanh toán thành công
      if (nextStatus === 'PAID') {
        updateData.paymentFailedAt = null;
      }

      const result = await tx.order.updateMany({
        where: { id: orderId, status: currentStatus },
        data: updateData,
      });
      if (result.count !== 1) {
        throw new BadRequestException('Trạng thái đơn hàng đã thay đổi. Vui lòng thử lại');
      }

      // Hoàn trả nguyên liệu khi hủy / thanh toán thất bại
      const shouldRelease =
        (currentStatus === 'PENDING' && nextStatus === 'PAYMENT_FAILED') ||
        ((currentStatus === 'PENDING' ||
          currentStatus === 'PAYMENT_FAILED' ||
          currentStatus === 'PAID') &&
          nextStatus === 'CANCELLED');

      if (shouldRelease) {
        const handled = await releaseOrderIngredients(tx, orderId);
        if (!handled) {
          // Hoàn trả trực tiếp trên tồn kho
          for (const item of order.items) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
                version: { increment: 1 },
              },
            });
          }
        }
      }

      // Giữ lại nguyên liệu khi thử thanh toán lại PAYMENT_FAILED → PENDING
      if (currentStatus === 'PAYMENT_FAILED' && nextStatus === 'PENDING') {
        const handled = await reserveOrderIngredients(tx, orderId);
        if (!handled) {
          for (const item of order.items) {
            const reserved = await tx.product.updateMany({
              where: { id: item.productId, stock: { gte: item.qty } },
              data: {
                stock: { decrement: item.qty },
                version: { increment: 1 },
              },
            });
            if (reserved.count !== 1) {
              throw new BadRequestException('Không đủ tồn kho để thử thanh toán lại');
            }
          }
        }
      }

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: { items: { include: { product: true } } },
      });
    });
  }

  /**
   * EX-09a: PENDING quá 15 phút → CANCELLED trực tiếp
   */
  async cancelExpiredPendingOrders(
    deadline: Date,
  ): Promise<{ updatedCount: number }> {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: deadline },
      },
      select: { id: true },
    });

    if (expiredOrders.length === 0) {
      return { updatedCount: 0 };
    }

    const orderIds = expiredOrders.map((o) => o.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { id: { in: orderIds }, status: 'PENDING' },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          note: 'Đơn hủy tự động: quá 15 phút chưa thanh toán',
        },
      });

      // Hoàn trả nguyên liệu
      for (const orderId of orderIds) {
        const handled = await releaseOrderIngredients(tx, orderId);
        if (!handled) {
          const orderItems = await tx.orderItem.findMany({
            where: { orderId },
            select: { productId: true, qty: true },
          });
          for (const item of orderItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
                version: { increment: 1 },
              },
            });
          }
        }
      }
    });

    this.logger.log(
      `[EX-09a] Đã hủy ${orderIds.length} đơn PENDING quá 15 phút → CANCELLED`,
    );

    return { updatedCount: orderIds.length };
  }

  /**
   * EX-09b: PAYMENT_FAILED quá 15 phút → CANCELLED
   */
  async cancelExpiredPaymentFailedOrders(
    deadline: Date,
  ): Promise<{ updatedCount: number }> {
    const expiredOrders = await this.prisma.order.findMany({
      where: {
        status: 'PAYMENT_FAILED',
        paymentFailedAt: { lt: deadline },
      },
      select: { id: true },
    });

    if (expiredOrders.length === 0) {
      return { updatedCount: 0 };
    }

    const orderIds = expiredOrders.map((o) => o.id);

    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { id: { in: orderIds }, status: 'PAYMENT_FAILED' },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          note: 'Đơn hủy tự động: thanh toán thất bại quá 15 phút',
        },
      });

      // Hoàn trả nguyên liệu
      for (const orderId of orderIds) {
        const handled = await releaseOrderIngredients(tx, orderId);
        if (!handled) {
          const orderItems = await tx.orderItem.findMany({
            where: { orderId },
            select: { productId: true, qty: true },
          });
          for (const item of orderItems) {
            await tx.product.update({
              where: { id: item.productId },
              data: {
                stock: { increment: item.qty },
                version: { increment: 1 },
              },
            });
          }
        }
      }
    });

    this.logger.log(
      `[EX-09b] Đã hủy ${orderIds.length} đơn PAYMENT_FAILED quá 15 phút → CANCELLED`,
    );

    return { updatedCount: orderIds.length };
  }

  async findMyOrders(userId: number) {
    return this.prisma.order.findMany({
      where: { userId },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(userId: number, orderId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }
}
