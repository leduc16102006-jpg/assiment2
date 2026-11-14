import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProductsService - Task 10.3 Ingredient Inventory', () => {
  let service: ProductsService;
  let prisma: {
    product: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();

    prisma = {
      product: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new ProductsService(prisma as unknown as PrismaService);
  });

  it('Tính đúng số ly theo từng size và không trả version/recipes', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 2,
      name: 'Latte',
      price: 55000,
      imageUrl: null,
      stock: 999,
      version: 1,
      recipes: [
        { size: 'DEFAULT', quantity: 18, ingredient: { stock: 100 } },
        { size: 'DEFAULT', quantity: 150, ingredient: { stock: 1000 } },
        { size: 'S', quantity: 15, ingredient: { stock: 100 } },
        { size: 'M', quantity: 18, ingredient: { stock: 100 } },
        { size: 'M', quantity: 150, ingredient: { stock: 1000 } },
        { size: 'L', quantity: 25, ingredient: { stock: 100 } },
      ],
    });

    const result = await service.findOne(2);

    expect(result.stock).toBe(5);
    expect(result.availableBySize).toEqual({
      DEFAULT: 5,
      S: 6,
      M: 5,
      L: 4,
    });

    // ✅ Không trả version ra ngoài
    expect(result).not.toHaveProperty('version');
    // ✅ Không trả công thức ra ngoài
    expect(result).not.toHaveProperty('recipes');
  });

  it('Sản phẩm chưa có công thức phải có stock = 0', async () => {
    prisma.product.findMany.mockResolvedValue([
      {
        id: 10,
        name: 'Sản phẩm chưa có công thức',
        price: 45000,
        imageUrl: null,
        stock: 50,
        version: 1,
        recipes: [],
      },
    ]);

    const result = await service.findAll();

    expect(result).toHaveLength(1);
    expect(result[0].stock).toBe(0);
    expect(result[0].availableBySize).toEqual({
      DEFAULT: 0,
      S: 0,
      M: 0,
      L: 0,
    });
    expect(result[0]).not.toHaveProperty('version');
  });

  it('Thiếu nguyên liệu thì không thể pha chế', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 2,
      name: 'Latte',
      price: 55000,
      imageUrl: null,
      stock: 50,
      version: 1,
      recipes: [
        { size: 'DEFAULT', quantity: 18, ingredient: { stock: 100 } },
        { size: 'DEFAULT', quantity: 150, ingredient: { stock: 0 } },
      ],
    });

    const result = await service.findOne(2);

    expect(result.stock).toBe(0);
    expect(result.availableBySize.DEFAULT).toBe(0);
  });

  it('Công thức có quantity = 0 không được tính tồn kho', async () => {
    prisma.product.findUnique.mockResolvedValue({
      id: 2,
      name: 'Latte',
      price: 55000,
      imageUrl: null,
      stock: 50,
      version: 1,
      recipes: [{ size: 'DEFAULT', quantity: 0, ingredient: { stock: 1000 } }],
    });

    const result = await service.findOne(2);

    expect(result.stock).toBe(0);
  });

  it('Trả lỗi khi sản phẩm không tồn tại', async () => {
    prisma.product.findUnique.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });
});
