// src/app/modules/admin/admin.service.ts
import { prisma } from '../../../lib/prisma';
import { getOrSetCache } from '../../../utils/cache';
import { CacheKeys } from '../../../utils/cacheKeys';
import { type IPaginationOptions as IOptions } from '../../../utils/paginationHelper';
import { paginationHelper } from "../../../utils/paginationHelper";
// ── OVERVIEW ──────────────────────────────────────────────────────────────────
export const getDashboardOverview = async () => {
  return getOrSetCache(
    CacheKeys.ADMIN_DASHBOARD,
    300, // 5 min cache
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
        topProducts,
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
        
        // recent 5 orders
        prisma.order.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: { select: { id: true } },
          },
        }),
        
        // top 5 selling products by order item count
        prisma.orderItem.groupBy({
          by: ['productId'],
          _sum: { quantity: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 5,
        }),
      ]);

      // enrich top products with product details
      const topProductDetails = await Promise.all(
        topProducts.map(async (item) => {
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
          return { ...product, totalSold: item._sum.quantity };
        })
      );

      // 🔥 format status data
      const formattedOrdersByStatus = ordersByStatus.reduce((acc: any, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {});

      // 🔥 format roles
      const formattedUsersByRole = usersByRole.reduce((acc: any, item) => {
        acc[item.role] = item._count.role;
        return acc;
      }, {});

      return {
totalRevenue: totalRevenue._sum?.total?.toNumber?.() ?? 0,        totalOrders,
        totalUsers,
        totalProducts,
        totalStores,

        ordersByStatus: formattedOrdersByStatus,
        usersByRole: formattedUsersByRole,

        recentOrders,
        topProducts,
      };
    }
  );
};

// ── REVENUE BY STORE ──────────────────────────────────────────────────────────
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
    const revenue = store.orderItems.reduce((sum, item) => sum + Number(item.priceAtTime) * item.quantity, 0);
    const { orderItems, ...storeWithoutItems } = store;
    return { ...storeWithoutItems, totalRevenue: Number(revenue.toFixed(2)) };
  });

  return {
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};

// ── RECENT PAYMENTS (delivered orders) ───────────────────────────────────────
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
            store: { select: { id: true, name: true } },
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

// ── VENDORS with search + filter ──────────────────────────────────────────────
export const getVendors = async (query: { search?: string; isActive?: string }, options: IOptions) => {
  const { page, limit, skip, sortBy, sortOrder } = paginationHelper.calculatePagination(options);

  const where = {
    owner: {
      role: 'VENDOR' as const,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' as const } },
          { email: { contains: query.search, mode: 'insensitive' as const } },
        ],
      }),
    },
    ...(query.isActive !== undefined && {
      isActive: query.isActive === 'true',
    }),
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

// ── TOP SELLING PRODUCTS ──────────────────────────────────────────────────────
export const getTopSellingProducts = async (options: IOptions) => {
  const { page, limit, skip } = paginationHelper.calculatePagination(options);

  // IMPORTANT: make cache key dynamic per page
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
            id: true,
            name: true,
            price: true,
            stock: true,
            images: { take: 1 },
            category: { select: { id: true, name: true } },
            store: { select: { id: true, name: true } },
          },
        });

        return {
          ...product,
          totalSold: item._sum.quantity,
          totalOrders: item._count.id,
        };
      })
    );

    return {
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      data,
    };
  });
};
