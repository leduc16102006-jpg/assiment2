import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags, ApiResponse } from '@nestjs/swagger';
import { PromotionsService } from './promotions.service';

@ApiTags('Promotions') // Bắt buộc phải có để hiện mục Promotions trên Swagger
@Controller('promotions') // Đường dẫn gốc là /promotions
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get(':code')
  @ApiOperation({ summary: 'Lấy thông tin mã giảm giá (Task 10.4)' })
  @ApiParam({ name: 'code', description: 'Mã ưu đãi (ví dụ: WELCOME5)', required: true })
  @ApiResponse({ status: 200, description: 'Trả về thông tin mã hợp lệ' })
  @ApiResponse({ status: 404, description: 'Mã không tồn tại hoặc hết hạn' })
  async getPromotionByCode(@Param('code') code: string) {
    // Gọi xuống service
    const promo = await this.promotionsService.findByCode(code);
    if (!promo) {
      throw new NotFoundException(`Mã giảm giá "${code}" không tồn tại.`);
    }
    return promo;
  }
}