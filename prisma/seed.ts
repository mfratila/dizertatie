import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Admin user (demo only)
  await prisma.user.upsert({
    where: { email: 'admin@demo.local' },
    update: {},
    create: {
      email: 'admin@demo.local',
      password: 'admin123', // DEMO ONLY
      role: 'ADMIN',
    },
  });

  // Demo project
  await prisma.project.upsert({
    where: { name: 'Project Alpha' },
    update: {},
    create: {
      name: 'Project Alpha',
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
