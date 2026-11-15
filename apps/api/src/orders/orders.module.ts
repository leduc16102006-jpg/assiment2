import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderCleanupService } from './order-cleanup.service';
@Module({
  controllers: [OrdersController],
  providers: [OrdersService , OrderCleanupService ],
  exports: [OrdersService],
})
export class OrdersModule {}
