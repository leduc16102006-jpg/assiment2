// apps/api/src/scheduler/orders-expiry.job.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class OrdersExpiryJob {
  private readonly logger = new Logger(OrdersExpiryJob.name);

  constructor(private readonly ordersService: OrdersService) {}

  // Chạy mỗi 5 phút (có thể đổi thành 15 phút nếu muốn)
  @Cron(CronExpression.EVERY_5_MINUTES, {
    name: 'check-pending-orders-expiry',
    timeZone: 'Asia/Ho_Chi_Minh', // ✅ Quan trọng: Đúng múi giờ Việt Nam
  })
  async handleExpiredOrders() {
    this.logger.log('🔄 Bắt đầu kiểm tra đơn hàng quá hạn thanh toán...');

    try {
      const result = await this.ordersService.markExpiredOrdersAsFailed();
      this.logger.log(
        `✅ Hoàn tất: Đã xử lý ${result.updatedCount} đơn hàng quá hạn`,
      );
    } catch (error) {
      this.logger.error(
        '❌ Lỗi khi xử lý đơn hàng quá hạn',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
