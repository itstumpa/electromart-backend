// src/app/modules/admin/admin.service.ts
import { paginationHelper, IOptions } from "../../shared/paginationHelper";
import { prisma } from "../../../lib/prisma";

// ── OVERVIEW ──────────────────────────────────────────────────────────────────
export const getDashboardOverview = async () => {
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
      where: { status: "DELIVERED" },
      _sum: { totalAmount: true },
    }),

    // total orders
    prisma.order.count(),

    // orders grouped by status
    prisma.order.groupBy({
      by: ["status"],
      _count: { status: true },
    }),

    // total users
    prisma.user.count(),

    // users by role
    prisma.user.groupBy({
      by: ["role"],
      _count: { role: true },
    }),

    // total active products
    prisma.product.count({ where: { isActive: true } }),

    // total active stores
    prisma.store.count({ where: { isActive: true } }),

    // recent 5 orders
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { select: { id: true } },
      },
    }),

    // top 5 selling products by order item count
    prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
      orderBy: { _sum: { quantity: "desc" } },
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

  return {
    revenue: {
      total: Number(totalRevenue._sum.totalAmount || 0),
    },
    orders: {
      total: totalOrders,
      byStatus: ordersByStatus.reduce((acc, curr) => {
        acc[curr.status] = curr._count.status;
        return acc;
      }, {} as Record<string, number>),
    },
    users: {
      total: totalUsers,
      byRole: usersByRole.reduce((acc, curr) => {
        acc[curr.role] = curr._count.role;
        return acc;
      }, {} as Record<string, number>),
    },
    products: { total: totalProducts },
    stores: { total: totalStores },
    recentOrders,
    topProducts: topProductDetails,
  };
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
        where: { order: { status: "DELIVERED" } },
        select: { priceAtTime: true, quantity: true },
      },
      _count: { select: { products: true, orderItems: true } },
    },
  });

  const total = await prisma.store.count();

  const data = stores.map((store) => {
    const revenue = store.orderItems.reduce(
      (sum, item) => sum + Number(item.priceAtTime) * item.quantity,
      0
    );
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
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where = { status: "DELIVERED" as const };

  const [data, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true, email: true } },
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
export const getVendors = async (
  query: { search?: string; isActive?: string },
  options: IOptions
) => {
  const { page, limit, skip, sortBy, sortOrder } =
    paginationHelper.calculatePagination(options);

  const where = {
    owner: {
      role: "VENDOR" as const,
      ...(query.search && {
        OR: [
          { name: { contains: query.search, mode: "insensitive" as const } },
          { email: { contains: query.search, mode: "insensitive" as const } },
        ],
      }),
    },
    ...(query.isActive !== undefined && {
      isActive: query.isActive === "true",
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

  const grouped = await prisma.orderItem.groupBy({
    by: ["productId"],
    _sum: { quantity: true },
    _count: { id: true },
    orderBy: { _sum: { quantity: "desc" } },
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
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    data,
  };
};