// src/utils/cache.ts
import { getRedis } from "../app/config/redis";

const redis = getRedis();
// GET from cache or fetch from DB
export const getOrSetCache = async <T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached) as T;

  const fresh = await fetchFn();
  await redis.setex(key, ttlSeconds, JSON.stringify(fresh));
  return fresh;
};

// DELETE single key
export const invalidateCache = async (key: string) => {
  await redis.del(key);
};

// DELETE multiple keys by pattern e.g. "products:*"
export const invalidateCachePattern = async (pattern: string) => {
  const keys = await redis.keys(pattern);
  if (keys.length > 0) await redis.del(...keys);
};