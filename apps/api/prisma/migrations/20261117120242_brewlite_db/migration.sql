-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "note" TEXT,
ADD COLUMN     "paymentFailedAt" TIMESTAMP(3);
