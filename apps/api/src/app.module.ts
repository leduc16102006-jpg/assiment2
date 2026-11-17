
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { ProductsModule } from './products/products.module';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PromotionsModule } from './promotions/promotions.module';
import { OrdersModule } from './orders/orders.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { PaymentsModule } from './payments/payments.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    ProductsModule,
    AuthModule,
    HealthModule,
    PromotionsModule,
    OrdersModule,
    CartModule,
    PaymentsModule,

    // Chỉ đăng ký Scheduler một lần và không chạy khi test
    ...(process.env.NODE_ENV !== 'test'
      ? [ScheduleModule.forRoot(), SchedulerModule]
      : []),
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
