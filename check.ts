// check.ts
import { prisma } from './src/lib/prisma';

// check.ts  (replace the main function)
async function main() {
  const result = await prisma.store.updateMany({
    where: { isApproved: false },
    data: { isApproved: true },
  });
  console.log(`Updated ${result.count} stores → isApproved: true`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());