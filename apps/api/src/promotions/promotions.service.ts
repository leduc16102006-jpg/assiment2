import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service'; // Chỉnh lại đường dẫn nếu cần

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findByCode(code: string) {
    const promotion = await this.prisma.promotion.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promotion) {
      throw new NotFoundException(`Mã giảm giá "${code}" không tồn tại.`);
    }

    if (!promotion.isActive) {
      throw new NotFoundException(`Mã giảm giá "${code}" đã bị khóa hoặc hết hạn.`);
    }

    const now = new Date();
    if (promotion.startsAt > now || promotion.expiresAt < now) {
      throw new NotFoundException(`Mã giảm giá "${code}" không nằm trong thời gian áp dụng.`);
    }

    return promotion;
  }
}