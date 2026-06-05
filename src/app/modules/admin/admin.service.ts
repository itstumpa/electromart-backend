import { prisma } from '../../../lib/prisma';
import { getOrSetCache } from '../../../utils/cache';
import { CacheKeys } from '../../../utils/cacheKeys';
import { type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
import { paginationHelper } from '../../../utils/paginationHelper';

// ── OVERVIEW ──────────────────────────────────────────────────
export const getDashboardOverview = async () => {
  return getOrSetCache(
    CacheKeys.ADMIN_DASHBOARD,
    300,
    async () => {
      const [
        totalRevenue,
        totalOrders,
        ordersByStatus,
        totalUsers,
        usersByRole,
        totalProducts,
        totalStores,
        recentOrders,
        topProductsRaw,
        pendingVendors,
        monthlyRevenueRaw,
      ] = await Promise.all([
        // total revenue from delivered orders
        prisma.order.aggregate({
          where: { status: 'DELIVERED' },
          _sum: { total: true },
        }),

        // total orders
        prisma.order.count(),

        // orders grouped by status
        prisma.order.groupBy({
          by: ['status'],
          _count: { status: true },
        }),

        // total users
        prisma.user.count(),

        // users by role
        prisma.user.groupBy({
          by: ['role'],
          _count: { role: true },
        }),

        // total active products
        prisma.product.count({ where: { isActive: true } }),

        // total active stores
        prisma.store.count({ where: { isActive: true } }),

        // recent 5 orders with user + item count
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { select: { id: true } },
          },
        }),

        // top 5 selling products by quantity
        prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          _count: { id: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),

        // pending vendor approvals
        prisma.store.findMany({
          where: { isApproved: false },
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),

        // last 6 months revenue — raw query for grouping by month
        prisma.$queryRaw<{ month: string; revenue: number; orders: bigint }[]>`
          SELECT
            TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') AS month,
            SUM(total)::float                                      AS revenue,
            COUNT(*)                                               AS orders
          FROM "Order"
          WHERE "createdAt" >= NOW() - INTERVAL '6 months'
          GROUP BY DATE_TRUNC('month', "createdAt")
          ORDER BY DATE_TRUNC('month', "createdAt") ASC
        `,
      ]);

      // enrich top products with full details
      const topProducts = await Promise.all(
        topProductsRaw.map(async (item) => {
          const product = await prisma.product.findUnique({
            where: { id: item.productId },
            select: {
              id: true,
              name: true,
              price: true,
              images: { take: 1 },
              store: { select: { id: true, name: true } },
            },
          });
          return {
            ...product,
            totalSold: item._sum.quantity ?? 0,
            totalOrders: item._count.id,
          };
        }),
      );

      // format monthly revenue for chart
      const revenueData = monthlyRevenueRaw.map((r) => ({
        month: r.month, // "2026-03"
        revenue: Number(r.revenue),
        orders: Number(r.orders),
      }));

      const formattedOrdersByStatus = ordersByStatus.reduce(
        (acc: Record<string, number>, item) => {
          acc[item.status] = item._count.status;
          return acc;
        },
        {},
      );

      const formattedUsersByRole = usersByRole.reduce(
        (acc: Record<string, number>, item) => {
          acc[item.role] = item._count.role;
          return acc;
        },
        {},
      );

      return {
        totalRevenue: totalRevenue._sum?.total?.toNumber?.() ?? 0,
        totalOrders,
        totalUsers,
        totalProducts,
        totalStores,
        ordersByStatus: formattedOrdersByStatus,
        usersByRole: formattedUsersByRole,
        recentOrders,
        topProducts,
        pendingVendors,
        revenueData,
      };
    },
  );
};

// ── REVENUE BY STORE ──────────────────────────────────────────
export const getRevenueByStore = async (options: IOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  const stores = await prisma.store.findMany({
    skip,
    take: limit,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      orderItems: {
        where: { order: { status: 'DELIVERED' } },
        select: { priceAtTime: true, quantity: true },
      },
      _count: { select: { products: true, orderItems: true } },
    },
  });

  const total = await prisma.store.count();

  const data = stores.map((store) => {
    const revenue = store.orderItems.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0,
    );
    const { orderItems, ...rest } = store;
    return { ...rest, totalRevenue: Number(revenue.toFixed(2)) };
  });

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// ── RECENT PAYMENTS ───────────────────────────────────────────
export const getRecentPayments = async (options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const where = { status: 'DELIVERED' as const };

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            store:   { select: { id: true, name: true } },
            product: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// ── VENDORS ───────────────────────────────────────────────────
export const getVendors = async (
  query: { search?: string; isActive?: string },
  options: IOptions,
) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const where = {
    owner: {
      role: 'VENDOR' as const,
      ...(query.search && {
        OR: [
          { name:  { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    },
    ...(query.isActive !== undefined && { isActive: query.isActive === 'true' }),
  };

  const [data, total] = await Promise.all([
    prisma.store.findMany({
      where,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: { select: { products: true, orderItems: true } },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.store.count({ where }),
  ]);

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// ── TOP SELLING PRODUCTS ──────────────────────────────────────
export const getTopSellingProducts = async (options: IOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);
  const cacheKey = `${CacheKeys.ADMIN_TOP_PRODUCTS}:${page}:${limit}`;

  return getOrSetCache(cacheKey, 300, async () => {
    const grouped = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true },
      _count: { id: true },
      orderBy: { _sum: { quantity: 'desc' } },
      skip,
      take: limit,
    });

    const total = await prisma.product.count();

    const data = await Promise.all(
      grouped.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            id: true, name: true, price: true, stock: true,
            images:   { take: 1 },
            category: { select: { id: true, name: true } },
            store:    { select: { id: true, name: true } },
          },
        });
        return {
          ...product,
          totalSold:   item._sum.quantity ?? 0,
          totalOrders: item._count.id,
        };
      }),
    );

    return {
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
      data,
    };
  });
};