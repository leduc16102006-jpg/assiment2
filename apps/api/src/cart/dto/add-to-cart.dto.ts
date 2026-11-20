import {
  IsArray,
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
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];

  @IsOptional()
  @IsString()
  topping?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}