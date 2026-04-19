// src/app/modules/vendor-analytics/vendorAnalytics.service.ts
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";

export const getVendorAnalytics = async (ownerId: string) => {
  const store = await prisma.store.findUnique({ where: { ownerId } });
  if (!store) throw new ApiError(404, "Store not found");

  const storeId = store.id;

  const [
    ordersByStatus,
    totalCustomers,
    topProducts,
    avgOrderValue,
    monthlyRevenue,
  ] = await Promise.all([

    // orders by status scoped to store
    prisma.orderItem.groupBy({
      by: ["status"],
      where: { storeId },
      _count: { status: true },
    }),

    // unique customers who bought from this store
    prisma.orderItem.findMany({
      where: { storeId },
      select: { order: { select: { customerId: true } } },
      distinct: ["orderId"],
    }),

    // top 5 products by revenue
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { storeId, order: { status: "DELIVERED" } },
      _sum: { quantity: true, priceAtTime: true },
      orderBy: { _sum: { priceAtTime: "desc" } },
      take: 5,
    }),

    // average order value for this store
    prisma.orderItem.aggregate({
      where: { storeId, order: { status: "DELIVERED" } },
      _avg: { priceAtTime: true },
    }),

    // monthly revenue — last 6 months
    prisma.$queryRaw<{ month: string; revenue: number }[]>`
      SELECT
        TO_CHAR(o."createdAt", 'YYYY-MM') AS month,
        SUM(oi."priceAtTime" * oi.quantity) AS revenue
      FROM "OrderItem" oi
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE oi."storeId" = ${storeId}
        AND o.status = 'DELIVERED'
        AND o."createdAt" >= NOW() - INTERVAL '6 months'
      GROUP BY month
      ORDER BY month ASC
    `,
  ]);

  // enrich top products with names
  const topProductDetails = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true, name: true, price: true, images: { take: 1 } },
      });
      return {
        ...product,
        totalRevenue: Number(item._sum.priceAtTime || 0),
        totalSold: item._sum.quantity,
      };
    })
  );

  // unique customer count
  const uniqueCustomerIds = new Set(
    totalCustomers.map((i) => i.order.customerId)
  );

  return {
    store: { id: store.id, name: store.name },
    ordersByStatus: ordersByStatus.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>),
    totalCustomers: uniqueCustomerIds.size,
    averageOrderValue: Number(
      (avgOrderValue._avg.priceAtTime || 0).toFixed(2)
    ),
    topProducts: topProductDetails,
    monthlyRevenue: monthlyRevenue.map((r) => ({
      month: r.month,
      revenue: Number(r.revenue),
    })),
  };
};