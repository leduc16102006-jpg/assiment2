import { PrismaClient } from '@prisma/client';
// Khai báo bcrypt để băm mật khẩu trực tiếp trong seed
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const products = [
  { id: 1, name: 'Americano', price: 39000, imageUrl: '/images/americano.jpg', stock: 50 },
  { id: 2, name: 'Latte', price: 55000, imageUrl: '/images/latte.jpg', stock: 50 },
  { id: 3, name: 'Cappuccino', price: 55000, imageUrl: '/images/cappuccino.jpg', stock: 50 },
  { id: 4, name: 'Bac Xiu', price: 45000, imageUrl: '/images/bac-xiu.jpg', stock: 50 },
  { id: 5, name: 'Black coffee', price: 35000, imageUrl: '/images/black-coffee.jpg', stock: 50 },
  { id: 6, name: 'Macchiato', price: 55000, imageUrl: '/images/macchiato.jpg', stock: 50 },
  { id: 7, name: 'Espresso', price: 39000, imageUrl: '/images/espresso.jpg', stock: 50 },
  { id: 8, name: 'Milk coffee', price: 45000, imageUrl: '/images/milk-coffee.jpg', stock: 50 },
  { id: 9, name: 'Mocha', price: 55000, imageUrl: '/images/mocha.jpg', stock: 50 },
  { id: 10, name: 'Salty coffee', price: 45000, imageUrl: '/images/salty-coffee.jpg', stock: 50 },
];

async function main() {
  // 1. Tạo User mẫu để test Đăng nhập
  const defaultPassword = await bcrypt.hash('Password123', 10);
  await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: defaultPassword,
      fullName: 'Khách hàng BrewLite',
    },
  });
  console.log('Seeded User: user@example.com');

  // 2. Tạo Mã giảm giá WELCOME5
  await prisma.promotion.upsert({
    where: { code: 'WELCOME5' },
    update: {},
    create: {
      code: 'WELCOME5',
      type: 'PERCENT',
      value: 5,
      startsAt: new Date(),
      expiresAt: new Date(new Date().setFullYear(new Date().getFullYear() + 1)), // Hết hạn sau 1 năm
      isActive: true,
    },
  });
  console.log('Seeded Promotion: WELCOME5');

  // 3. Tạo 10 món đồ uống
  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...product,
      },
    });
  }
  console.log('Seeded 10 BrewLite products');
}

main()
  .catch((error) => {
    console.error(error);
    throw error;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });