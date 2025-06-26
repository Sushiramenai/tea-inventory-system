import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';
import { UserRole } from '../src/constants/enums';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default admin user
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

  // Create sample users
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

  console.log('\n📝 Default login credentials:');
  console.log('Admin: admin@teacompany.com / admin123');
  console.log('Fulfillment: fulfillment@teacompany.com / fulfillment123');
  console.log('Production: production@teacompany.com / production123');
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