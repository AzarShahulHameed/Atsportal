import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL ?? 'admin@catapult.com';

  // No hardcoded password in source — read from env if provided, otherwise
  // generate a random one and print it ONCE. This file is committed to a
  // public repo; a fixed literal password here would be exposed forever
  // the moment it's pushed, regardless of what the running database uses.
  const password = process.env.ADMIN_PASSWORD ?? crypto.randomBytes(12).toString('base64url');
  const passwordHash = await bcrypt.hash(password, 10);

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: 'Admin',
      role: Role.ADMIN,
      mustChangePassword: true,
    },
  });

  console.log(`Seeded admin user: ${admin.email}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.log(`Generated password (shown once, not stored anywhere): ${password}`);
  }
  console.log('mustChangePassword is set — you will be required to set your own password on first login.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
