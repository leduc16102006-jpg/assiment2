import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrdersService } from '../orders/orders.service';

@Injectable()
export class OrdersExpiryJob {
  private readonly logger = new Logger(OrdersExpiryJob.name);

  private readonly PENDING_TIMEOUT = 15;        // ⏱️ 15 phút PENDING → CANCELLED
  private readonly PAYMENT_FAILED_TIMEOUT = 15;  // ⏱️ 15 phút PAYMENT_FAILED → CANCELLED

  constructor(private readonly ordersService: OrdersService) {}

  @Cron(CronExpression.EVERY_MINUTE, {
    name: 'check-orders-expiry',
    timeZone: 'Asia/Ho_Chi_Minh',
  })
  async handleOrderExpiry() {
    this.logger.log('🔄 Bắt đầu kiểm tra đơn hàng quá hạn...');

    try {
      const now = new Date();

      // ========== BƯỚC 1: PENDING quá 15 phút → CANCELLED ==========
      const pendingDeadline = new Date(now.getTime() - this.PENDING_TIMEOUT * 60 * 1000);
      const pendingResult = await this.ordersService.cancelExpiredPendingOrders(pendingDeadline);
      if (pendingResult.updatedCount > 0) {
        this.logger.log(`🗑️ PENDING → CANCELLED: Đã hủy ${pendingResult.updatedCount} đơn`);
      }

      // ========== BƯỚC 2: PAYMENT_FAILED quá 15 phút → CANCELLED ==========
      const failedDeadline = new Date(now.getTime() - this.PAYMENT_FAILED_TIMEOUT * 60 * 1000);
      const failedResult = await this.ordersService.cancelExpiredPaymentFailedOrders(failedDeadline);
      if (failedResult.updatedCount > 0) {
        this.logger.log(`🗑️ PAYMENT_FAILED → CANCELLED: Đã hủy ${failedResult.updatedCount} đơn`);
      }

      const total = pendingResult.updatedCount + failedResult.updatedCount;
      if (total === 0) {
        this.logger.log('✅ Không có đơn hàng quá hạn');
      } else {
        this.logger.log(`✅ Hoàn tất: Tổng cộng hủy ${total} đơn hàng`);
      }
    } catch (error) {
      this.logger.error(
        '❌ Lỗi xử lý đơn hàng quá hạn',
        error instanceof Error ? error.stack : error,
      );
    }
  }
}
