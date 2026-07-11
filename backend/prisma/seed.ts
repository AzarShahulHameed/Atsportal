import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('ChangeMe123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@catapult.com' },
    update: {},
    create: {
      email: 'admin@catapult.com',
      passwordHash,
      name: 'Admin',
      role: Role.ADMIN,
    },
  });

  console.log('Seeded admin user:', admin.email, '(password: ChangeMe123! — change it after first login)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
