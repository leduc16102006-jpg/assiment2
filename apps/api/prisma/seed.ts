import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const drinks = [
  { id: 1,  name: 'Americano',    price: 39000, imageUrl: '/images/americano.jpg',    stock: 50 },
  { id: 2,  name: 'Latte',        price: 55000, imageUrl: '/images/latte.jpg',        stock: 50 },
  { id: 3,  name: 'Cappuccino',   price: 55000, imageUrl: '/images/cappuccino.jpg',   stock: 50 },
  { id: 4,  name: 'Bac Xiu',     price: 45000, imageUrl: '/images/bac-xiu.jpg',      stock: 50 },
  { id: 5,  name: 'Black coffee', price: 35000, imageUrl: '/images/black-coffee.jpg', stock: 50 },
  { id: 6,  name: 'Macchiato',    price: 55000, imageUrl: '/images/macchiato.jpg',    stock: 50 },
  { id: 7,  name: 'Espresso',     price: 39000, imageUrl: '/images/espresso.jpg',     stock: 50 },
  { id: 8,  name: 'Milk coffee',  price: 45000, imageUrl: '/images/milk-coffee.jpg',  stock: 50 },
  { id: 9,  name: 'Mocha',        price: 55000, imageUrl: '/images/mocha.jpg',        stock: 50 },
  { id: 10, name: 'Salty coffee', price: 45000, imageUrl: '/images/salty-coffee.jpg', stock: 50 },
] as const;

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed is disabled in production.');
  }

  // The Product model has no unique constraint on `name`.
  // Use stable demo IDs and reject mismatches instead of overwriting other products.
  await prisma.$transaction(async (tx) => {
    for (const drink of drinks) {
      const existingId = await tx.product.findUnique({ where: { id: drink.id } });
      if (existingId && existingId.name !== drink.name) {
        throw new Error(
          `Product ID ${drink.id} already belongs to "${existingId.name}". ` +
          'Do not seed this database without reviewing its data.',
        );
      }

      const existingName = await tx.product.findFirst({
        where: { name: drink.name },
        select: { id: true },
      });
      if (existingName && existingName.id !== drink.id) {
        throw new Error(
          `Product "${drink.name}" already uses ID ${existingName.id}; ` +
          `expected demo ID ${drink.id}.`,
        );
      }

      await tx.product.upsert({
        where: { id: drink.id },
        create: { ...drink },
        update: {
          // Safe to refresh demo display fields; never reset consumed inventory.
          price: drink.price,
          imageUrl: drink.imageUrl,
        },
      });
    }
  });

  // Explicit IDs do not advance PostgreSQL's generated SERIAL sequence.
  // Sync it to the largest current ID to protect future auto-generated inserts.
  await prisma.$queryRaw`
    SELECT setval(
      pg_get_serial_sequence('"Product"', 'id'),
      (SELECT MAX("id") FROM "Product"),
      true
    )
  `;

  const count = await prisma.product.count({
    where: { id: { in: drinks.map((drink) => drink.id) } },
  });
  console.log(`[seed] ${count}/${drinks.length} BrewLite drinks ready.`);
  console.log('[seed] Existing product stock and version were preserved.');
}

main()
  .catch((error: unknown) => {
    console.error('[seed] Failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
