import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';
import { getOrSetCache, invalidateCache } from '../../../utils/cache';
import { CacheKeys } from '../../../utils/cacheKeys';
import { uploadToCloudinary,  deleteFromCloudinary, } from '../../../utils/uploadToCloudinary';

// ─────────────────────────────────────────────
// helper
// ─────────────────────────────────────────────
const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// ─────────────────────────────────────────────
// VENDOR — create store
// ─────────────────────────────────────────────
export const createStore = async (ownerId: string, data: { name: string; description?: string; logo?: string }) => {
  const existing = await prisma.store.findUnique({ where: { ownerId } });
  if (existing) throw new ApiError(409, 'You already have a store');

  const slug = generateSlug(data.name);

  const slugExists = await prisma.store.findUnique({ where: { slug } });
  if (slugExists) throw new ApiError(409, 'Store name already taken, try a different name');

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
        orderBy: { createdAt: 'desc' },
      })
  );
};

// ─────────────────────────────────────────────
// PUBLIC — get single store (cached)
// ─────────────────────────────────────────────
export const getStoreById = async (id: string) => {
  return getOrSetCache(CacheKeys.SINGLE_STORE(id), 600, async () => {
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

    if (!store) throw new ApiError(404, 'Store not found');
    return store;
  });
};

// ─────────────────────────────────────────────
// VENDOR — update store
// ─────────────────────────────────────────────
export const updateStore = async (
  storeId: string,
  requesterId: string,
  data: { name?: string; description?: string; logo?: string; coverImage?: string;
    specialty?: string;
    badge?: string;
    offers?: string; isActive?: boolean },
     logoFile?: Express.Multer.File,
) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store) throw new ApiError(404, 'Store not found');

  if (store.ownerId !== requesterId) {
    throw new ApiError(403, 'You can only update your own store');
  }

  let logoUrl = data.logo;
 
  if (logoFile) {
    // delete old logo from cloudinary if exists
    if (store.logo) {
      const publicId = store.logo.split('/').pop()?.split('.')[0];
      if (publicId) await deleteFromCloudinary(`stores/${publicId}`).catch(() => null);
    }
    const uploaded = await uploadToCloudinary(logoFile.buffer, 'stores');
    logoUrl = uploaded.secure_url;
  }
 

  const updated = await prisma.store.update({
    where: { id: storeId },
    data: { ...data, logo: logoUrl },
  });

  // invalidate cache
  await invalidateCache(CacheKeys.SINGLE_STORE(storeId));
  await invalidateCache(CacheKeys.ALL_STORES);

  return updated;
};


// ── UPDATE store policies ─────────────────────────────────────
export const updateStorePolicies = async (
  storeId: string,
  vendorId: string,
  data: { returnPolicy: string; shippingPolicy: string },
) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store)               throw new ApiError(404, 'Store not found');
  if (store.ownerId !== vendorId) throw new ApiError(403, 'Forbidden');
 
  return prisma.store.update({
    where: { id: storeId },
    data,
  });
};
 
// ── PAUSE store (toggle isActive) ────────────────────────────
export const pauseStore = async (storeId: string, vendorId: string) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store)               throw new ApiError(404, 'Store not found');
  if (store.ownerId !== vendorId) throw new ApiError(403, 'Forbidden');
 
  return prisma.store.update({
    where: { id: storeId },
    data: { isActive: !store.isActive },
  });
};
 
// ── DELETE all products ───────────────────────────────────────
export const deleteAllProducts = async (storeId: string, vendorId: string) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store)               throw new ApiError(404, 'Store not found');
  if (store.ownerId !== vendorId) throw new ApiError(403, 'Forbidden');
 
  const { count } = await prisma.product.deleteMany({ where: { storeId } });
  return { deleted: count };
};
 
// ── CLOSE store (permanent) ───────────────────────────────────
export const closeStore = async (storeId: string, vendorId: string) => {
  const store = await prisma.store.findUnique({ where: { id: storeId } });
  if (!store)               throw new ApiError(404, 'Store not found');
  if (store.ownerId !== vendorId) throw new ApiError(403, 'Forbidden');
 
  // deactivate all products first
  await prisma.product.updateMany({
    where: { storeId },
    data: { isActive: false },
  });
 
  return prisma.store.update({
    where: { id: storeId },
    data: { isActive: false, isApproved: false },
  });
};
 
// ─────────────────────────────────────────────
// ADMIN — delete store
// ─────────────────────────────────────────────
export const deleteStore = async (id: string) => {
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) throw new ApiError(404, 'Store not found');

  await prisma.store.delete({ where: { id } });

  // invalidate cache
  await invalidateCache(CacheKeys.SINGLE_STORE(id));
  await invalidateCache(CacheKeys.ALL_STORES);

  return { message: 'Store deleted successfully' };
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

export async function getTopVendors() {
  const stores = await prisma.store.findMany({
    where: {
      isActive: true,
      isApproved: true,
    },
    orderBy: { totalSales: 'desc' },
    take: 10,
    select: {
      id: true,
      name: true,
      slug: true,
      logo: true,
      coverImage: true,
      specialty: true,
      badge: true,
      offers: true,
      totalSales: true,
      rating: true,
      _count: {
        select: { products: true },
      },
    },
  });

  return stores.map((s) => ({
    ...s,
    totalProducts: s._count.products,
    _count: undefined,
  }));
}

