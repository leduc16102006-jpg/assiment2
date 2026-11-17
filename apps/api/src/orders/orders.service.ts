import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';

import { Prisma} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

import {
  calculateIngredientRequirements,
  releaseOrderIngredients,
  reserveIngredients,
  reserveOrderIngredients,
} from './ingredient-stock';

import {
  CreateOrderDto,
  CreateOrderItemDto,
} from './dto/create-order.dto';

import { CreateOrderFromCartDto } from './dto/create-order-from-cart.dto';
import { OrderStatus } from './dto/update-order-status.dto';
import { calculateUnitPrice } from '../shared/pricing/product-pricing';

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
    return this.prisma.$transaction(
      async (tx) => {
        return this.createOrderInTransaction(
          tx,
          userId,
          dto.items,
          dto.promotionCode,
        );
      },
      { maxWait: 10000, timeout: 20000 },
    );
  }

  /**
   * Tạo đơn hàng trực tiếp từ giỏ hàng.
   * Xóa các CartItem và tạo Order trong cùng transaction.
   * Nếu tạo đơn thất bại, thao tác xóa giỏ cũng rollback.
   */
  async createFromCart(userId: number, dto: CreateOrderFromCartDto) {
    return this.prisma.$transaction(
      async (tx) => {
        const cart = await tx.cart.findUnique({
          where: { userId },
          include: {
            items: {
              orderBy: { id: 'asc' },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new BadRequestException('Giỏ hàng đang trống');
        }

        // Chuyển dữ liệu CartItem sang cấu trúc CreateOrderItemDto.
        const items: CreateOrderItemDto[] = cart.items.map((item) => ({
          productId: item.productId,
          qty: item.quantity,
          size: item.size,
          toppings: item.topping ? [item.topping] : [],
        }));

        // Xóa theo danh sách ID đã đọc.
        // Nếu request khác đã lấy và xóa các item này trước,
        // count sẽ không khớp và transaction hiện tại phải rollback.
        const cartItemIds = cart.items.map((item) => item.id);

        const deleted = await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            id: { in: cartItemIds },
          },
        });

        if (deleted.count !== cartItemIds.length) {
          throw new ConflictException(
            'Giỏ hàng vừa được thay đổi hoặc đã được đặt hàng. Vui lòng tải lại giỏ hàng.',
          );
        }

        // Tạo đơn trong cùng transaction.
        // Nếu bước này lỗi, việc xóa CartItem cũng được rollback.
        return this.createOrderInTransaction(
          tx,
          userId,
          items,
          dto.promotionCode,
        );
      },
      {
        maxWait: 10000,
        timeout: 20000,
      },
    );
  }

  /**
   * Logic tạo đơn dùng chung cho:
   * - POST /orders
   * - POST /orders/from-cart
   */
  private async createOrderInTransaction(
    tx: Prisma.TransactionClient,
    userId: number,
    items: CreateOrderItemDto[],
    promotionCode?: string,
  ) {
    if (!items?.length) {
      throw new BadRequestException(
        'Đơn hàng phải có ít nhất một sản phẩm',
      );
    }

    // Kiểm tra dữ liệu đầu vào và chuẩn hóa topping.
    const normalizedItems = items.map((item) => {
      if (!Number.isInteger(item.productId) || item.productId <= 0) {
        throw new BadRequestException('productId không hợp lệ');
      }

      if (!Number.isInteger(item.qty) || item.qty <= 0) {
        throw new BadRequestException('Số lượng sản phẩm không hợp lệ');
      }

      const toppings = (item.toppings ?? [])
        .map((topping) => topping.trim())
        .filter(Boolean);

      if (new Set(toppings).size !== toppings.length) {
        throw new BadRequestException(
          'Không được chọn topping trùng lặp',
        );
      }

      return {
        productId: item.productId,
        qty: item.qty,
        size: item.size?.trim().toUpperCase() || 'DEFAULT',
        toppings,
      };
    });

    // Không cho phép hai dòng có cùng sản phẩm, size và topping.
    const itemKeys = normalizedItems.map((item) => {
      const toppingsKey = [...item.toppings].sort().join(',');
      return `${item.productId}_${item.size}_${toppingsKey}`;
    });

    if (new Set(itemKeys).size !== itemKeys.length) {
      throw new BadRequestException(
        'Sản phẩm cùng kích cỡ và topping không được lặp lại. Vui lòng tăng số lượng.',
      );
    }

    // Kiểm tra người dùng.
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      throw new UnauthorizedException('Tài khoản không tồn tại');
    }

    // Lấy thông tin sản phẩm từ database.
    const uniqueProductIds = [
      ...new Set(normalizedItems.map((item) => item.productId)),
    ];

    const products = await tx.product.findMany({
      where: {
        id: { in: uniqueProductIds },
      },
    });

    if (products.length !== uniqueProductIds.length) {
      throw new NotFoundException(
        'Một hoặc nhiều sản phẩm không tồn tại',
      );
    }

    const productMap = new Map(
      products.map((product) => [product.id, product]),
    );

    // Tính giá từng sản phẩm bằng hàm dùng chung.
    let subtotal = 0;

    const orderItems = normalizedItems.map((item) => {
      const product = productMap.get(item.productId);

      if (!product) {
        throw new NotFoundException('Sản phẩm không tồn tại');
      }

      const unitPrice = calculateUnitPrice(
        Number(product.price),
        item.size,
        item.toppings,
      );

      const lineTotal = unitPrice * item.qty;

      if (!Number.isSafeInteger(lineTotal) || lineTotal < 0) {
        throw new BadRequestException(
          'Giá trị sản phẩm không hợp lệ',
        );
      }

      subtotal += lineTotal;

      if (!Number.isSafeInteger(subtotal)) {
        throw new BadRequestException(
          'Tổng tiền đơn hàng vượt giới hạn cho phép',
        );
      }

      // Giữ cấu trúc OrderItem hiện tại:
      // size chứa cả kích cỡ và thông tin topping.
      const toppingText =
        item.toppings.length > 0
          ? ` (+ ${item.toppings.join(', ')})`
          : '';

      const savedSize =
        item.size === 'DEFAULT'
          ? item.toppings.length > 0
            ? item.toppings.join(', ')
            : null
          : `${item.size}${toppingText}`;

      return {
        productId: product.id,
        qty: item.qty,
        size: savedSize,
        lineTotal,
      };
    });

    // Áp dụng khuyến mãi.
    let promotionId: number | null = null;
    let discountAmount = 0;

    if (promotionCode?.trim()) {
      const code = promotionCode.trim().toUpperCase();

      const promotion = await tx.promotion.findUnique({
        where: { code },
      });

      if (!promotion) {
        throw new BadRequestException(
          'Mã khuyến mãi không tồn tại',
        );
      }

      const now = new Date();

      if (
        !promotion.isActive ||
        now < promotion.startsAt ||
        now > promotion.expiresAt
      ) {
        throw new BadRequestException(
          'Mã khuyến mãi không hoạt động hoặc đã hết hạn',
        );
      }

      if (subtotal < promotion.minOrderAmount) {
        throw new BadRequestException(
          `Đơn hàng phải đạt tối thiểu ${promotion.minOrderAmount.toLocaleString('vi-VN')} đồng`,
        );
      }

      if (promotion.type === 'PERCENT') {
        discountAmount = Math.floor(
          (subtotal * promotion.value) / 100,
        );

        if (promotion.maxDiscount !== null) {
          discountAmount = Math.min(
            discountAmount,
            promotion.maxDiscount,
          );
        }
      } else {
        discountAmount = promotion.value;
      }

      discountAmount = Math.min(discountAmount, subtotal);
      promotionId = promotion.id;
    }

    const total = Math.max(0, subtotal - discountAmount);

    // Tính nguyên liệu cần thiết và giữ kho.
    // Nếu không đủ nguyên liệu, transaction sẽ rollback.
    const requirements = await calculateIngredientRequirements(
      tx,
      normalizedItems,
    );

    await reserveIngredients(tx, requirements);

    // Tạo đơn hàng.
    return tx.order.create({
      data: {
        userId,
        subtotal,
        discountAmount,
        promotionId,
        total,
        status: 'PENDING',
        ingredientsReserved: true,

        items: {
          create: orderItems,
        },

        ingredientUses: {
          create: requirements.map((requirement) => ({
            ingredientId: requirement.ingredientId,
            quantity: requirement.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        ingredientUses: {
          include: {
            ingredient: true,
          },
        },
      },
    });
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
  // 1. Tìm các đơn hàng PENDING đã quá hạn
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

  const orderIds = expiredOrders.map((order) => order.id);

  // 2. Xử lý hủy đơn và hoàn kho trong cùng transaction
  const updatedCount = await this.prisma.$transaction(async (tx) => {
    let count = 0;

    for (const orderId of orderIds) {
      // Chỉ hủy nếu đơn vẫn đang PENDING
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          status: 'PENDING',
          createdAt: { lt: deadline },
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          note: 'Đơn hủy tự động: quá 15 phút chưa thanh toán',
        },
      });

      // Nếu đơn đã thay đổi trạng thái thì bỏ qua
      if (result.count !== 1) {
        continue;
      }

      count++;

      // 3. Hoàn trả nguyên liệu đã giữ
      const handled = await releaseOrderIngredients(tx, orderId);

      // 4. Fallback cho đơn hàng cũ chưa có dữ liệu nguyên liệu
      if (!handled) {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
          select: {
            productId: true,
            qty: true,
          },
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

    return count;
  });

  // 5. Ghi log kết quả thực tế
  this.logger.log(
    `[EX-09a] Đã hủy ${updatedCount} đơn PENDING quá 15 phút → CANCELLED`,
  );

  return { updatedCount };
}

  /**
   * EX-09b: PAYMENT_FAILED quá 15 phút → CANCELLED
   */
  
async cancelExpiredPaymentFailedOrders(
  deadline: Date,
): Promise<{ updatedCount: number }> {
  // 1. Tìm các đơn PAYMENT_FAILED đã quá hạn
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

  const orderIds = expiredOrders.map((order) => order.id);

  // 2. Hủy đơn và hoàn kho trong cùng transaction
  const updatedCount = await this.prisma.$transaction(async (tx) => {
    let count = 0;

    for (const orderId of orderIds) {
      // Chỉ hủy nếu đơn vẫn PAYMENT_FAILED và đã quá hạn
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          status: 'PAYMENT_FAILED',
          paymentFailedAt: { lt: deadline },
        },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          note: 'Đơn hủy tự động: thanh toán thất bại quá 15 phút',
        },
      });

      // Đơn đã thay đổi trạng thái thì không hoàn kho
      if (result.count !== 1) {
        continue;
      }

      count++;

      // 3. Hoàn trả nguyên liệu đã giữ
      const handled = await releaseOrderIngredients(tx, orderId);

      // 4. Fallback cho đơn cũ chưa có dữ liệu nguyên liệu
      if (!handled) {
        const orderItems = await tx.orderItem.findMany({
          where: { orderId },
          select: {
            productId: true,
            qty: true,
          },
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

    return count;
  });

  // 5. Ghi log số đơn thực tế đã hủy
  this.logger.log(
    `[EX-09b] Đã hủy ${updatedCount} đơn PAYMENT_FAILED quá 15 phút → CANCELLED`,
  );

  return { updatedCount };
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
