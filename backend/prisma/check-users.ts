import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { email: true, name: true, role: true, isActive: true, mustChangePassword: true },
    orderBy: { createdAt: 'asc' },
  });
  console.table(users);
}

main().finally(() => prisma.$disconnect());
