
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ICart } from './interfaces/cart.interface';

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
  constructor(
    private readonly cartService: CartService,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Xem giỏ hàng hiện tại',
  })
  async getCart(
  @Req() req: AuthenticatedRequest,
): Promise<ICart> {
  return this.cartService.getCart(req.user.userId);
}

  @Post('items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Thêm sản phẩm vào giỏ hàng',
  })
  @ApiBody({
    type: AddToCartDto,
    examples: {
      withTopping: {
        summary: 'Thêm sản phẩm có topping',
        value: {
          productId: 1,
          size: 'M',
          topping: 'Trân châu',
          quantity: 1,
        },
      },
      withoutTopping: {
        summary: 'Thêm sản phẩm không có topping',
        value: {
          productId: 2,
          size: 'L',
          quantity: 2,
        },
      },
    },
  })
  async addItem(
  @Req() req: AuthenticatedRequest,
  @Body() dto: AddToCartDto,
): Promise<ICart> {
  return this.cartService.addItem(req.user.userId, dto);
}

  @Put('items')
  @ApiOperation({
    summary: 'Cập nhật số lượng sản phẩm trong giỏ',
  })
  @ApiBody({
    type: UpdateCartItemDto,
    examples: {
      updateQty: {
        summary: 'Thay đổi số lượng',
        value: {
          itemId: '123e4567-e89b-12d3-a456-426614174000',
          quantity: 3,
        },
      },
    },
  })
  async updateItem(
  @Req() req: AuthenticatedRequest,
  @Body() dto: UpdateCartItemDto,
): Promise<ICart> {
  return this.cartService.updateItem(req.user.userId, dto);
}

  @Delete('items/:itemId')
  @ApiOperation({
    summary: 'Xóa một sản phẩm khỏi giỏ',
  })
  @ApiParam({
    name: 'itemId',
    description: 'ID của sản phẩm trong giỏ hàng',
  })
  async removeItem(
  @Req() req: AuthenticatedRequest,
  @Param('itemId') itemId: string,
): Promise<ICart> {
  return this.cartService.removeItem(req.user.userId, itemId);
}

  @Delete()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Xóa toàn bộ giỏ hàng',
  })
  async clearCart(
    @Req() req: AuthenticatedRequest,
  ): Promise<void> {
    return this.cartService.clearCart(req.user.userId);
  }

  @Get('check-empty')
  @ApiOperation({
    summary: 'Kiểm tra giỏ hàng có trống không',
  })
  async checkEmpty(
    @Req() req: AuthenticatedRequest,
  ): Promise<{ isEmpty: boolean }> {
    return {
      isEmpty: await this.cartService.isEmpty(req.user.userId),
    };
  }
}
