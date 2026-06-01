// check.ts
import { prisma } from './src/lib/prisma';
import { invalidateCache } from './src/utils/cache';

async function main() {
  // add to check.ts main()
const storeId = 'store-vendor-1'; // your actual store id

const revenue = await prisma.$queryRaw`
  SELECT
    TO_CHAR(o."createdAt", 'YYYY-MM') AS month,
    SUM(oi."priceAtTime" * oi.quantity) AS revenue
  FROM "OrderItem" oi
  JOIN "Order" o ON o.id = oi."orderId"
  WHERE oi."storeId" = ${storeId}
    AND oi.status = 'DELIVERED'
    AND o."createdAt" >= NOW() - INTERVAL '6 months'
  GROUP BY month
  ORDER BY month ASC
`;
console.log('Revenue:', revenue);
  // get your store id first
  const store = await prisma.store.findFirst({
    where: { ownerId: 'user-vendor-1' },
    select: { id: true },
  });
  console.log('Store:', store);
  
  if (store) {
    await invalidateCache(`vendor_analytics:${store.id}`);
    console.log('Cache cleared');
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());