import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createOrganizationWithUsers(
  orgName: string,
  suffix: string,
  password: string,
) {
  const organization = await prisma.organization.upsert({
    where: { name: orgName },
    update: {},
    create: {
      name: orgName,
      status: 'ACTIVE',
    },
  });

  await prisma.users.upsert({
    where: { login: `admin${suffix}` },
    update: {},
    create: {
      login: `admin${suffix}`,
      password,
      role: 'ADMIN',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
  });

  await prisma.users.upsert({
    where: { login: `operator${suffix}` },
    update: {},
    create: {
      login: `operator${suffix}`,
      password,
      role: 'OPERATOR',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
  });

  await prisma.users.upsert({
    where: { login: `guard${suffix}` },
    update: {},
    create: {
      login: `guard${suffix}`,
      password,
      role: 'GUARD',
      status: 'ACTIVE',
      organizationId: organization.id,
    },
  });
}

async function main() {
  const salt = await bcrypt.genSalt();
  const password = await bcrypt.hash('1111', salt);

  await createOrganizationWithUsers('Default Organization', '', password);

  await createOrganizationWithUsers('Second Organization', '2', password);

  await createOrganizationWithUsers('Third Organization', '3', password);
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
