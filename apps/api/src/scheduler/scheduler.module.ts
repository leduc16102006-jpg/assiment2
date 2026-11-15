// apps/api/src/scheduler/scheduler.module.ts
import { Module } from '@nestjs/common';
import { OrdersExpiryJob } from './orders-expiry.job';
import { OrdersModule } from '../orders/orders.module'; // Cần gọi OrdersService

@Module({
  imports: [OrdersModule],
  providers: [OrdersExpiryJob],
  exports: [OrdersExpiryJob],
})
export class SchedulerModule {}
