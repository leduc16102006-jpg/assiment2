import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrderCleanupService {
  private readonly logger = new Logger(OrderCleanupService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredOrders() {
    const expirationTime = new Date(Date.now() - 15 * 60 * 1000);

    // 1. Tìm các đơn PENDING quá hạn và lấy kèm ingredientUses + items
    const stuckOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: expirationTime },
      },
      include: {
        ingredientUses: true,
        items: true,
      },
    });

    if (stuckOrders.length === 0) return;

    this.logger.warn(`Phát hiện ${stuckOrders.length} đơn hàng bị treo. Đang hoàn kho nguyên liệu...`);

    for (const order of stuckOrders) {
      await this.prisma.$transaction(async (tx) => {
        // Chỉ hoàn nếu đơn này thực sự đã giữ nguyên liệu
        if (order.ingredientsReserved && order.ingredientUses.length > 0) {
          for (const use of order.ingredientUses) {
            await tx.ingredient.update({
              where: { id: use.ingredientId },
              data: {
                stock: { increment: use.quantity },
                version: { increment: 1 }, // Optimistic Locking Task 10.3
              },
            });
          }
        }

        // Hoàn lại stock hiển thị của Product (nếu có trừ ở Task 6)
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: {
              stock: { increment: item.qty },
            },
          });
        }

        // Cập nhật trạng thái đơn và gạt cờ ingredientsReserved về false
        await tx.order.update({
          where: { id: order.id },
          data: {
            status: 'PAYMENT_FAILED',
            ingredientsReserved: false,
          },
        });
      });

      this.logger.log(`Đã hủy đơn #${order.id}, hoàn nguyên liệu và set ingredientsReserved = false.`);
    }
  }
}