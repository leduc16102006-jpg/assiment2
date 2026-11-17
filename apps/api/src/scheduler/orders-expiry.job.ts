import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class OrdersExpiryJob {
  private readonly logger = new Logger(OrdersExpiryJob.name);
  
  // Thời gian quy định (tính bằng phút)
  private readonly PENDING_TIMEOUT = 15;     // ⏱️ 15 phút ở PENDING
  private readonly PAYMENT_FAILED_TIMEOUT = 15; // ⏱️ 15 phút ở PAYMENT_FAILED

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_MINUTE) // Kiểm tra mỗi phút 1 lần
  async handleOrderExpiry() {
    this.logger.log('🔄 Bắt đầu kiểm tra đơn hàng quá hạn thanh toán...');

    const now = new Date();
    
    // ========== BƯỚC 1: PENDING → PAYMENT_FAILED sau 15 phút ==========
    const pendingDeadline = new Date(now.getTime() - this.PENDING_TIMEOUT * 60 * 1000);
    
    const pendingOrders = await this.prisma.order.findMany({
      where: {
        status: 'PENDING',
        createdAt: { lt: pendingDeadline }, // Tạo hơn 15 phút trước
      },
    });

    if (pendingOrders.length > 0) {
      this.logger.log(`⏳ Tìm thấy ${pendingOrders.length} đơn hàng PENDING quá hạn → chuyển sang PAYMENT_FAILED`);
      
      for (const order of pendingOrders) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'PAYMENT_FAILED',
            paymentFailedAt: now,
          },
        });
      }
    }

    // ========== BƯỚC 2: PAYMENT_FAILED → CANCELLED sau 15 phút ==========
    const failedDeadline = new Date(now.getTime() - this.PAYMENT_FAILED_TIMEOUT * 60 * 1000);
    
    const failedOrders = await this.prisma.order.findMany({
      where: {
        status: 'PAYMENT_FAILED',
        paymentFailedAt: { lt: failedDeadline }, // Chuyển trạng thái hơn 15 phút trước
      },
    });

    if (failedOrders.length > 0) {
      this.logger.log(`🗑️ Tìm thấy ${failedOrders.length} đơn hàng PAYMENT_FAILED quá hạn → hủy đơn`);
      
      for (const order of failedOrders) {
        await this.prisma.order.update({
          where: { id: order.id },
          data: {
            status: 'CANCELLED',
            cancelledAt: now,
            ingredientsReserved: false, // ✅ Trả lại nguyên liệu đã dự trữ
          },
        });
        
        // TODO: Tùy chọn — Trả lại số lượng tồn kho sản phẩm nếu cần
        // await this.restoreStock(order.id);
      }
    }

    this.logger.log(`✅ Hoàn tất: Xử lý ${pendingOrders.length + failedOrders.length} đơn hàng`);
  }
}
