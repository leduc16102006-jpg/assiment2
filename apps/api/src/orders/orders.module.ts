import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderCleanupService } from './order-cleanup.service';
import { OrdersExpiryJob } from '../scheduler/orders-expiry.job'; // ✅ Import job
@Module({
  controllers: [OrdersController],
  providers: [OrdersService , OrderCleanupService, OrdersExpiryJob],
  exports: [OrdersService],
})
export class OrdersModule {}
