import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { getOrSetCache } from '../../../utils/cache';
import { CacheKeys } from '../../../utils/cacheKeys';

export const getVendorAnalytics = async (ownerId: string) => {
  const store = await prisma.store.findUnique({
    where: { ownerId },
  });

  if (!store) throw new ApiError(404, 'Store not found');

  const storeId = store.id;

  return getOrSetCache(
    CacheKeys.VENDOR_ANALYTICS(storeId),
    180, // 3 min cache
    async () => {
      const [ordersByStatus, customers, topProducts, avgOrderValue, monthlyRevenue] = await Promise.all([
        // orders by status
        prisma.orderItem.groupBy({
          by: ['status'],
          where: { storeId },
          _count: { status: true },
        }),

        // customers (raw list)
        prisma.orderItem.findMany({
          where: { storeId },
          select: {
            order: { select: { userId: true } },
          },
          distinct: ['orderId'],
        }),

        // top products
        prisma.orderItem.groupBy({
          by: ['productId'],
          where: {
            storeId,
            status: 'DELIVERED',
          },
          _sum: {
            quantity: true,
            priceAtTime: true,
          },
          orderBy: {
            _sum: { priceAtTime: 'desc' },
          },
          take: 5,
        }),

        // avg order value
        prisma.orderItem.aggregate({
          where: {
            storeId,
            status: 'DELIVERED',
          },
          _avg: { priceAtTime: true },
        }),

        prisma.$queryRaw<{ month: string; revenue: number; orders: number }[]>`
  SELECT
    TO_CHAR(o."createdAt", 'YYYY-MM') AS month,
    SUM(oi."priceAtTime" * oi.quantity) AS revenue,
    COUNT(DISTINCT oi."orderId") AS orders
  FROM "OrderItem" oi
  JOIN "Order" o ON o.id = oi."orderId"
  WHERE oi."storeId" = ${storeId}
    AND oi.status != 'CANCELLED'
    AND o."createdAt" >= NOW() - INTERVAL '6 months'
  GROUP BY month
  ORDER BY month ASC
`,
      ]);

      // ─────────────────────────────
      // enrich top products
      // ─────────────────────────────
      const topProductDetails = await Promise.all(
        topProducts.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              name: true,
              price: true,
              images: { take: 1 },
            },
          });

          return {
            ...product,
            totalRevenue: Number(item._sum.priceAtTime || 0),
            totalSold: item._sum.quantity,
          };
        })
      );

      // ─────────────────────────────
      // unique customers
      // ─────────────────────────────
      const uniqueCustomerIds = new Set(customers.map((c) => c.order.userId));

      return {
        store: {
          id: store.id,
          name: store.name,
        },

        ordersByStatus: ordersByStatus.reduce((acc: Record<string, number>, curr) => {
          acc[curr.status] = curr._count.status;
          return acc;
        }, {}),

        totalCustomers: uniqueCustomerIds.size,

        averageOrderValue: Number((avgOrderValue._avg.priceAtTime || 0).toFixed(2)),

        topProducts: topProductDetails,

        monthlyRevenue: monthlyRevenue.map((r) => ({
          month: r.month,
          revenue: Number(r.revenue),
          orders: Number(r.orders),
        })),
      };
    }
  );
};
