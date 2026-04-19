import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
import {
  getOrSetCache,
  invalidateCache,
} from "../../../utils/cache";
import { CacheKeys } from "../../../utils/cacheKeys";


// ─────────────────────────────────────────────
// helper
// ─────────────────────────────────────────────
const generateSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");


// ─────────────────────────────────────────────
// VENDOR — create store
// ─────────────────────────────────────────────
export const createStore = async (
  ownerId: string,
  data: { name: string; description?: string; logo?: string }
) => {
  const existing = await prisma.store.findUnique({ where: { ownerId } });
  if (existing) throw new ApiError(409, "You already have a store");

  const slug = generateSlug(data.name);

  const slugExists = await prisma.store.findUnique({ where: { slug } });
  if (slugExists)
    throw new ApiError(409, "Store name already taken, try a different name");

  const store = await prisma.store.create({
    data: { ...data, slug, ownerId },
  });

  // invalidate cache
  await invalidateCache(CacheKeys.ALL_STORES);

  return store;
};


// ─────────────────────────────────────────────
// PUBLIC — get all stores (cached)
// ─────────────────────────────────────────────
export const getAllStores = async () => {
  return getOrSetCache(
    CacheKeys.ALL_STORES,
    600, // 10 min
    () =>
      prisma.store.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          slug: true,
          description: true,
          logo: true,
          owner: {
            select: { id: true, name: true },
          },
          _count: {
            select: { products: true },
          },
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      })
  );
};


// ─────────────────────────────────────────────
// PUBLIC — get single store (cached)
// ─────────────────────────────────────────────
export const getStoreById = async (id: string) => {
  return getOrSetCache(
    CacheKeys.SINGLE_STORE(id),
    600,
    async () => {
      const store = await prisma.store.findUnique({
        where: { id },
        include: {
          owner: { select: { id: true, name: true } },
          products: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              images: { take: 1 },
            },
          },
        },
      });

      if (!store) throw new ApiError(404, "Store not found");
      return store;
    }
  );
};


// ─────────────────────────────────────────────
// VENDOR — update store
// ─────────────────────────────────────────────
export const updateStore = async (
  storeId: string,
  requesterId: string,
  data: { name?: string; description?: string; logo?: string; isActive?: boolean }
) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, "Store not found");

  if (store.ownerId !== requesterId) {
    throw new ApiError(403, "You can only update your own store");
  }

  const updated = await prisma.store.update({
    where: { id: storeId },
    data,
  });

  // invalidate cache
  await invalidateCache(CacheKeys.SINGLE_STORE(storeId));
  await invalidateCache(CacheKeys.ALL_STORES);

  return updated;
};


// ─────────────────────────────────────────────
// ADMIN — delete store
// ─────────────────────────────────────────────
export const deleteStore = async (id: string) => {
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) throw new ApiError(404, "Store not found");

  await prisma.store.delete({ where: { id } });

  // invalidate cache
  await invalidateCache(CacheKeys.SINGLE_STORE(id));
  await invalidateCache(CacheKeys.ALL_STORES);

  return { message: "Store deleted successfully" };
};


// ─────────────────────────────────────────────
// VENDOR — get my store (NOT cached because user-specific)
// ─────────────────────────────────────────────
export const getMyStore = async (ownerId: string) => {
  const store = await prisma.store.findUnique({
    where: { ownerId },
    include: {
      products: {
        select: {
          id: true,
          name: true,
          price: true,
          stock: true,
          isActive: true,
        },
      },
    },
  });

  if (!store) throw new ApiError(404, "You don't have a store yet");

  return store;
};