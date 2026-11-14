import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách thực đơn đồ uống' })
  findAll() {
    return this.productsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một sản phẩm theo ID' })
  @ApiParam({ name: 'id', description: 'ID của sản phẩm cần xem', example: 1 })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }
}

// DTO trả về cho Client — KHÔNG bao gồm version
export interface ProductResponse {
  id: number;
  name: string;
  price: number;
  imageUrl: string | null;
  stock: number;
  availableBySize: {
    DEFAULT: number;
    S: number;
    M: number;
    L: number;
  };
}

// Dữ liệu mẫu — ĐÃ BỔ SUNG availableBySize
export const MOCK_PRODUCTS: ProductResponse[] = [
  { id: 1, name: 'Americano', price: 39000, imageUrl: '/images/americano.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 2, name: 'Latte', price: 55000, imageUrl: '/images/latte.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 3, name: 'Cappuccino', price: 55000, imageUrl: '/images/cappuccino.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 4, name: 'Bac Xiu', price: 45000, imageUrl: '/images/bac-xiu.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 5, name: 'Black coffee', price: 35000, imageUrl: '/images/black-coffee.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 6, name: 'Macchiato', price: 55000, imageUrl: '/images/macchiato.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 7, name: 'Espresso', price: 39000, imageUrl: '/images/espresso.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 8, name: 'Milk coffee', price: 45000, imageUrl: '/images/milk-coffee.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 9, name: 'Mocha', price: 55000, imageUrl: '/images/mocha.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
  { id: 10, name: 'Salty coffee', price: 45000, imageUrl: '/images/salty-coffee.jpg', stock: 99, availableBySize: { DEFAULT: 99, S: 99, M: 99, L: 99 } },
];
