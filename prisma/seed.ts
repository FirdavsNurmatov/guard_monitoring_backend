import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('1111', salt);

  // Admin foydalanuvchi
  await prisma.users.upsert({
    where: { login: 'admin' },
    update: {},
    create: {
      login: 'admin',
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  // Operator foydalanuvchi
  await prisma.users.upsert({
    where: { login: 'operator' },
    update: {},
    create: {
      login: 'operator',
      password,
      role: 'OPERATOR',
      status: 'ACTIVE',
    },
  });

  // Guard foydalanuvchi
  await prisma.users.upsert({
    where: { login: 'guard' },
    update: {},
    create: {
      login: 'guard',
      password,
      role: 'GUARD',
      status: 'ACTIVE',
    },
  });
}

main()
  .then(async () => {
    console.log('Seed tugadi ✅');
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed xato ❌', e);
    await prisma.$disconnect();
    process.exit(1);
  });
