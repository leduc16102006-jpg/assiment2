import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiBody } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { CartResponseDto } from './dto/cart-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest {
  user: {
    userId: number;   
    email: string;
  };
}

@ApiTags('Cart')
@ApiBearerAuth()
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Xem giỏ hàng hiện tại' })
  async getCart(@Req() req: AuthenticatedRequest): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.userId);  // ✅ Dùng .userId
  }

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Thêm sản phẩm vào giỏ hàng' })
  @ApiBody({
    description: 'Thông tin sản phẩm cần thêm vào giỏ hàng',
    examples: {
      withTopping: {
        summary: 'Có topping',
        value: {
          productId: '1',
          productName: 'Americano',
          size: 'M',
          topping: 'Trân châu',
          quantity: 1,
          unitPrice: 39000,
        } as AddToCartDto,
      },
      withoutTopping: {
        summary: 'Không có topping',
        value: {
          productId: '2',
          productName: 'Cà phê sữa đá',
          size: 'L',
          quantity: 2,
          unitPrice: 45000,
        } as AddToCartDto,
      },
    },
  })
  async addItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(req.user.userId, dto);  // ✅ Dùng .userId
  }

  @Put('items')
  @ApiOperation({ summary: 'Cập nhật số lượng sản phẩm trong giỏ' })
  @ApiBody({
    description: 'ID của món và số lượng mới',
    examples: {
      updateQty: {
        summary: 'Thay đổi số lượng',
        value: {
          itemId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 3,
        } as UpdateCartItemDto,
      },
    },
  })
  async updateItem(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItem(req.user.userId, dto);  // ✅ Dùng .userId
  }

  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Xóa một sản phẩm khỏi giỏ' })
  async removeItem(
    @Req() req: AuthenticatedRequest,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(req.user.userId, itemId);  // ✅ Dùng .userId
  }

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Xóa toàn bộ giỏ hàng' })
  async clearCart(@Req() req: AuthenticatedRequest): Promise<void> {
    await this.cartService.clearCart(req.user.userId);  // ✅ Dùng .userId
  }

  @Get('check-empty')
  @ApiOperation({ summary: 'Kiểm tra giỏ hàng có trống không' })
  async checkEmpty(@Req() req: AuthenticatedRequest) {
    return { isEmpty: await this.cartService.isEmpty(req.user.userId) };  // ✅ Dùng .userId
  }
}
