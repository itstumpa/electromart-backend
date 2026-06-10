// check.ts
import { prisma } from './src/lib/prisma';
import { invalidateCache } from './src/utils/cache';

async function main() {
  const stores = await prisma.store.findMany({
    select: { id: true, name: true, isApproved: true, isActive: true }
  });
  console.log(JSON.stringify(stores, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());