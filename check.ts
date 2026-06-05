// check.ts
import { prisma } from './src/lib/prisma';
import { invalidateCache } from './src/utils/cache';

async function main() {
  const user = await prisma.user.findMany({
    where: { role: 'VENDOR' },
    select: { id: true, name: true, email: true, website: true, location: true, avatar: true }
  });
  
}

main().catch(console.error).finally(() => prisma.$disconnect());