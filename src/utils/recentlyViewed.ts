// src/utils/recentlyViewed.ts
import { prisma } from "../lib/prisma";

import { getRedis } from "../app/config/redis";

const redis = getRedis();

const KEY = (userId: string) => `recently_viewed:${userId}`;
const MAX_ITEMS = 10;
const TTL = 7 * 24 * 60 * 60; // 7 days

// add product to recently viewed list
export const addRecentlyViewed = async (
  userId: string,
  productId: string
) => {
  const key = KEY(userId);

  // remove if already exists (to re-insert at front)
  await redis.lrem(key, 0, productId);

  // push to front
  await redis.lpush(key, productId);

  // trim to max 10
  await redis.ltrim(key, 0, MAX_ITEMS - 1);

  // refresh TTL
  await redis.expire(key, TTL);
};

// get recently viewed with product details
export const getRecentlyViewed = async (userId: string) => {
  const key = KEY(userId);
  const productIds = await redis.lrange(key, 0, -1);

  if (productIds.length === 0) return [];

  // fetch product details preserving order
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
    select: {
      id: true, name: true, price: true,
      images: { take: 1 },
      store: { select: { id: true, name: true } },
      category: { select: { id: true, name: true } },
    },
  });

  // preserve Redis order
  return productIds
    .map((id) => products.find((p) => p.id === id))
    .filter(Boolean);
};

// clear recently viewed
export const clearRecentlyViewed = async (userId: string) => {
  await redis.del(KEY(userId));
};