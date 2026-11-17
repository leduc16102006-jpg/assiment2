import { IsNotEmpty, IsNumber, IsString, Min, IsOptional } from 'class-validator';

export class UpdateCartItemDto {
  @IsString()
  @IsNotEmpty()
  itemId!: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  quantity?: number;
}
