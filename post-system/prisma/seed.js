/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: { id: 'user-uuid-123' },
    update: {},
    create: {
      id: 'user-uuid-123',
      name: 'Demo Seller',
      phone: '+85512345678',
    },
  });
  console.log(`Seeded user: ${user.id} (${user.name})`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
