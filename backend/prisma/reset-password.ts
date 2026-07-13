// Usage: npx ts-node prisma/reset-password.ts <email> <newPassword>
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const [, , email, newPassword] = process.argv;
  if (!email || !newPassword) {
    console.error('Usage: npx ts-node prisma/reset-password.ts <email> <newPassword>');
    process.exit(1);
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  const user = await prisma.user.update({
    where: { email: email.toLowerCase().trim() },
    data: { passwordHash, mustChangePassword: true, isActive: true },
  });

  console.log(`Password reset for ${user.email}. isActive and mustChangePassword both set to true — you'll be prompted to set your own password on next login.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
