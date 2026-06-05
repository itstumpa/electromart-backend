// src/app/modules/leaderboard/leaderboard.service.ts
import { prisma } from "../../../lib/prisma";
import { getRedis } from "../../config/redis";

const redis = getRedis();

const LEADERBOARD_KEY = "vendor:leaderboard";
const TTL = 7 * 24 * 60 * 60; // 7 days

export const computeAndCacheLeaderboard = async () => {
  console.log("🏆 Computing vendor leaderboard...");

  const stores = await prisma.store.findMany({
    where: { isActive: true },
    include: {
      owner: { select: { id: true, name: true } },
      products: {
        include: {
          reviews: { select: { rating: true } },
          orderItems: {
            where: { order: { status: "DELIVERED" } },
            select: { quantity: true, priceAtTime: true },
          },
        },
      },
      _count: { select: { products: true } },
    },
  });

  const leaderboard = stores.map((store) => {
    // total revenue
    const revenue = store.products.reduce((sum, product) => {
      return sum + product.orderItems.reduce(
        (s, item) => s + Number(item.priceAtTime) * item.quantity, 0
      );
    }, 0);

    // total orders
    const totalOrders = store.products.reduce(
      (sum, p) => sum + p.orderItems.length, 0
    );

    // average rating
    const allRatings = store.products.flatMap((p) =>
      p.reviews.map((r) => r.rating)
    );
    const avgRating =
      allRatings.length > 0
        ? allRatings.reduce((a, b) => a + b, 0) / allRatings.length
        : 0;

    return {
      storeId: store.id,
      storeName: store.name,
      owner: store.owner,
      totalRevenue: Number(revenue.toFixed(2)),
      totalOrders,
      averageRating: Number(avgRating.toFixed(1)),
      totalProducts: store._count.products,
      score: revenue * 0.5 + totalOrders * 10 + avgRating * 20, // weighted score
    };
  });

  // sort by score descending
  leaderboard.sort((a, b) => b.score - a.score);

  // cache in Redis
  await redis.setex(LEADERBOARD_KEY, TTL, JSON.stringify(leaderboard));
  return leaderboard;
};

export const getLeaderboard = async () => {
  const cached = await redis.get(LEADERBOARD_KEY);
  if (cached) return JSON.parse(cached);

  // if not cached, compute on demand
  return computeAndCacheLeaderboard();
};