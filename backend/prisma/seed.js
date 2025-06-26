const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@teacompany.com' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@teacompany.com',
      passwordHash: await bcrypt.hash('admin123', 10),
      role: 'admin',
    },
  });

  const fulfillmentUser = await prisma.user.upsert({
    where: { email: 'fulfillment@teacompany.com' },
    update: {},
    create: {
      username: 'fulfillment',
      email: 'fulfillment@teacompany.com',
      passwordHash: await bcrypt.hash('fulfillment123', 10),
      role: 'fulfillment',
    },
  });

  const productionUser = await prisma.user.upsert({
    where: { email: 'production@teacompany.com' },
    update: {},
    create: {
      username: 'production',
      email: 'production@teacompany.com',
      passwordHash: await bcrypt.hash('production123', 10),
      role: 'production',
    },
  });

  console.log('✅ Users created');

  // Create some sample products
  const products = await Promise.all([
    prisma.productInventory.upsert({
      where: {
        teaName_sizeFormat_quantitySize: {
          teaName: 'Sencha',
          sizeFormat: 'pouch',
          quantitySize: '50g',
        },
      },
      update: {},
      create: {
        teaName: 'Sencha',
        category: 'tea',
        sizeFormat: 'pouch',
        quantitySize: '50g',
        sku: 'SEN-P-50',
        physicalCount: 25,
        reorderThreshold: 10,
      },
    }),
    prisma.productInventory.upsert({
      where: {
        teaName_sizeFormat_quantitySize: {
          teaName: 'Genmaicha',
          sizeFormat: 'tin',
          quantitySize: '100g',
        },
      },
      update: {},
      create: {
        teaName: 'Genmaicha',
        category: 'tea',
        sizeFormat: 'tin',
        quantitySize: '100g',
        sku: 'GEN-T-100',
        physicalCount: 15,
        reorderThreshold: 5,
      },
    }),
  ]);

  console.log('✅ Sample products created');

  // Create some raw materials
  const materials = await Promise.all([
    prisma.rawMaterial.upsert({
      where: {
        itemName_category: {
          itemName: 'Sencha Tea Leaves',
          category: 'tea',
        },
      },
      update: {},
      create: {
        itemName: 'Sencha Tea Leaves',
        category: 'tea',
        count: 10,
        unit: 'kg',
        quantityPerUnit: 1,
        totalQuantity: 10,
        reorderThreshold: 5,
      },
    }),
    prisma.rawMaterial.upsert({
      where: {
        itemName_category: {
          itemName: '5 inch Tins (Tall)',
          category: 'tins',
        },
      },
      update: {},
      create: {
        itemName: '5 inch Tins (Tall)',
        category: 'tins',
        count: 100,
        unit: 'pcs',
        totalQuantity: 100,
        reorderThreshold: 50,
      },
    }),
    prisma.rawMaterial.upsert({
      where: {
        itemName_category: {
          itemName: 'Pouch Labels - Sencha',
          category: 'pouch_label',
        },
      },
      update: {},
      create: {
        itemName: 'Pouch Labels - Sencha',
        category: 'pouch_label',
        count: 200,
        unit: 'pcs',
        totalQuantity: 200,
        reorderThreshold: 100,
      },
    }),
  ]);

  console.log('✅ Sample raw materials created');
  console.log('🎉 Database seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });