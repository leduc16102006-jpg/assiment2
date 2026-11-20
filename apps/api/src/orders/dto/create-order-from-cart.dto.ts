import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateOrderFromCartDto {
  @ApiPropertyOptional({
    example: 'WELCOME5',
    description: 'Mã khuyến mãi, không bắt buộc',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  promotionCode?: string;
}
