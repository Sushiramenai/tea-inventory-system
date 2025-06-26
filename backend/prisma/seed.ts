import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { UserRole } from '../src/constants/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default users
  const adminPassword = await hashPassword('admin123');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@teacompany.com' },
    update: {},
    create: {
      email: 'admin@teacompany.com',
      username: 'admin',
      passwordHash: adminPassword,
      role: UserRole.admin,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  const fulfillmentPassword = await hashPassword('fulfillment123');
  const fulfillmentUser = await prisma.user.upsert({
    where: { email: 'fulfillment@teacompany.com' },
    update: {},
    create: {
      email: 'fulfillment@teacompany.com',
      username: 'fulfillment',
      passwordHash: fulfillmentPassword,
      role: UserRole.fulfillment,
    },
  });
  console.log('✅ Fulfillment user created:', fulfillmentUser.email);

  const productionPassword = await hashPassword('production123');
  const productionUser = await prisma.user.upsert({
    where: { email: 'production@teacompany.com' },
    update: {},
    create: {
      email: 'production@teacompany.com',
      username: 'production',
      passwordHash: productionPassword,
      role: UserRole.production,
    },
  });
  console.log('✅ Production user created:', productionUser.email);

  // Create sample raw materials
  const rawMaterials = [
    {
      name: 'Green Tea Leaves',
      sku: 'MAT-GREEN-001',
      unit: 'kg',
      unitCost: 25.00,
      stockQuantity: 100,
      reorderLevel: 20,
      reorderQuantity: 50,
      supplier: 'Mountain Tea Farms',
      category: 'tea-leaves'
    },
    {
      name: 'Black Tea Leaves',
      sku: 'MAT-BLACK-001',
      unit: 'kg',
      unitCost: 22.00,
      stockQuantity: 80,
      reorderLevel: 15,
      reorderQuantity: 40,
      supplier: 'Valley Tea Estates',
      category: 'tea-leaves'
    },
    {
      name: 'Oolong Tea Leaves',
      sku: 'MAT-OOLONG-001',
      unit: 'kg',
      unitCost: 35.00,
      stockQuantity: 50,
      reorderLevel: 10,
      reorderQuantity: 30,
      supplier: 'Highland Tea Co',
      category: 'tea-leaves'
    },
    {
      name: 'Tea Bags',
      sku: 'MAT-BAGS-001',
      unit: 'units',
      unitCost: 0.05,
      stockQuantity: 5000,
      reorderLevel: 1000,
      reorderQuantity: 3000,
      supplier: 'EcoPack Solutions',
      category: 'packaging'
    },
    {
      name: 'Tea Tins (Small)',
      sku: 'MAT-TIN-S-001',
      unit: 'units',
      unitCost: 2.50,
      stockQuantity: 200,
      reorderLevel: 50,
      reorderQuantity: 100,
      supplier: 'Metal Containers Inc',
      category: 'packaging'
    },
    {
      name: 'Tea Boxes',
      sku: 'MAT-BOX-001',
      unit: 'units',
      unitCost: 0.75,
      stockQuantity: 500,
      reorderLevel: 100,
      reorderQuantity: 300,
      supplier: 'CardBoard Plus',
      category: 'packaging'
    },
    {
      name: 'Labels',
      sku: 'MAT-LABEL-001',
      unit: 'sheets',
      unitCost: 0.10,
      stockQuantity: 1000,
      reorderLevel: 200,
      reorderQuantity: 500,
      supplier: 'PrintPro Labels',
      category: 'packaging'
    },
  ];

  console.log('\n🌿 Creating raw materials...');
  for (const material of rawMaterials) {
    const created = await prisma.rawMaterial.upsert({
      where: { sku: material.sku },
      update: {
        stockQuantity: material.stockQuantity,
        unitCost: material.unitCost,
      },
      create: material,
    });
    console.log(`✅ Created/Updated: ${created.name} (${created.sku})`);
  }

  // Create sample products
  const products = [
    {
      name: 'Premium Green Tea',
      sku: 'PROD-GREEN-001',
      size: '20 bags',
      price: 15.99,
      stockQuantity: 50,
      reorderLevel: 20,
      reorderQuantity: 100,
      category: 'tea'
    },
    {
      name: 'Classic Black Tea',
      sku: 'PROD-BLACK-001',
      size: '20 bags',
      price: 12.99,
      stockQuantity: 75,
      reorderLevel: 25,
      reorderQuantity: 100,
      category: 'tea'
    },
    {
      name: 'Deluxe Oolong Tea',
      sku: 'PROD-OOLONG-001',
      size: '15 bags',
      price: 24.99,
      stockQuantity: 30,
      reorderLevel: 10,
      reorderQuantity: 50,
      category: 'tea'
    },
    {
      name: 'Green Tea Tin',
      sku: 'PROD-GREEN-TIN-001',
      size: '100g',
      price: 29.99,
      stockQuantity: 25,
      reorderLevel: 10,
      reorderQuantity: 40,
      category: 'tea'
    },
    {
      name: 'Black Tea Gift Box',
      sku: 'PROD-BLACK-BOX-001',
      size: '200g',
      price: 39.99,
      stockQuantity: 15,
      reorderLevel: 5,
      reorderQuantity: 20,
      category: 'gift-set'
    },
    {
      name: 'Tea Sampler Set',
      sku: 'PROD-SAMPLER-001',
      size: '3x50g',
      price: 45.99,
      stockQuantity: 20,
      reorderLevel: 8,
      reorderQuantity: 30,
      category: 'gift-set'
    },
  ];

  console.log('\n🍵 Creating products...');
  for (const product of products) {
    const created = await prisma.productInventory.upsert({
      where: { sku: product.sku },
      update: {
        stockQuantity: product.stockQuantity,
        price: product.price,
      },
      create: product,
    });
    console.log(`✅ Created/Updated: ${created.name} (${created.sku})`);
  }

  // Create Bill of Materials relationships
  console.log('\n📋 Creating Bill of Materials...');
  
  // Get products and materials
  const greenTeaProduct = await prisma.productInventory.findUnique({
    where: { sku: 'PROD-GREEN-001' }
  });
  const blackTeaProduct = await prisma.productInventory.findUnique({
    where: { sku: 'PROD-BLACK-001' }
  });
  const greenTeaTin = await prisma.productInventory.findUnique({
    where: { sku: 'PROD-GREEN-TIN-001' }
  });
  
  const greenLeaves = await prisma.rawMaterial.findUnique({
    where: { sku: 'MAT-GREEN-001' }
  });
  const blackLeaves = await prisma.rawMaterial.findUnique({
    where: { sku: 'MAT-BLACK-001' }
  });
  const teaBags = await prisma.rawMaterial.findUnique({
    where: { sku: 'MAT-BAGS-001' }
  });
  const tinSmall = await prisma.rawMaterial.findUnique({
    where: { sku: 'MAT-TIN-S-001' }
  });
  const labels = await prisma.rawMaterial.findUnique({
    where: { sku: 'MAT-LABEL-001' }
  });

  // Create BOM entries
  if (greenTeaProduct && greenLeaves && teaBags && labels) {
    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: greenTeaProduct.id,
          rawMaterialId: greenLeaves.id
        }
      },
      update: {},
      create: {
        productId: greenTeaProduct.id,
        rawMaterialId: greenLeaves.id,
        quantityRequired: 0.04, // 40g of tea leaves per product
      }
    });
    
    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: greenTeaProduct.id,
          rawMaterialId: teaBags.id
        }
      },
      update: {},
      create: {
        productId: greenTeaProduct.id,
        rawMaterialId: teaBags.id,
        quantityRequired: 20, // 20 tea bags per product
      }
    });

    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: greenTeaProduct.id,
          rawMaterialId: labels.id
        }
      },
      update: {},
      create: {
        productId: greenTeaProduct.id,
        rawMaterialId: labels.id,
        quantityRequired: 1, // 1 label per product
      }
    });
    console.log('✅ Created BOM for Premium Green Tea');
  }

  if (blackTeaProduct && blackLeaves && teaBags && labels) {
    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: blackTeaProduct.id,
          rawMaterialId: blackLeaves.id
        }
      },
      update: {},
      create: {
        productId: blackTeaProduct.id,
        rawMaterialId: blackLeaves.id,
        quantityRequired: 0.04, // 40g of tea leaves per product
      }
    });
    
    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: blackTeaProduct.id,
          rawMaterialId: teaBags.id
        }
      },
      update: {},
      create: {
        productId: blackTeaProduct.id,
        rawMaterialId: teaBags.id,
        quantityRequired: 20, // 20 tea bags per product
      }
    });
    console.log('✅ Created BOM for Classic Black Tea');
  }

  if (greenTeaTin && greenLeaves && tinSmall && labels) {
    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: greenTeaTin.id,
          rawMaterialId: greenLeaves.id
        }
      },
      update: {},
      create: {
        productId: greenTeaTin.id,
        rawMaterialId: greenLeaves.id,
        quantityRequired: 0.1, // 100g of tea leaves per tin
      }
    });
    
    await prisma.billOfMaterial.upsert({
      where: {
        productId_rawMaterialId: {
          productId: greenTeaTin.id,
          rawMaterialId: tinSmall.id
        }
      },
      update: {},
      create: {
        productId: greenTeaTin.id,
        rawMaterialId: tinSmall.id,
        quantityRequired: 1, // 1 tin per product
      }
    });
    console.log('✅ Created BOM for Green Tea Tin');
  }

  console.log('\n📝 Default login credentials:');
  console.log('Admin: username: admin, password: admin123');
  console.log('Fulfillment: username: fulfillment, password: fulfillment123');
  console.log('Production: username: production, password: production123');
  console.log('\n⚠️  Please change these passwords immediately!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });