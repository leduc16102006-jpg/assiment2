import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class AddToCartDto {
  @IsInt()
  @Min(1)
  productId!: number;

  @IsString()
  @IsNotEmpty()
  size!: string;

  @IsOptional()
  @IsString()
  topping?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}
