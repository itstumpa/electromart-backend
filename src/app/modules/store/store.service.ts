// src/app/modules/store/store.service.ts
import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";

// generate slug from store name e.g. "My Store" -> "my-store"
const generateSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// VENDOR — create their store
export const createStore = async (
  ownerId: string,
  data: { name: string; description?: string; logo?: string }
) => {
  // vendor can only have one store
  const existing = await prisma.store.findUnique({ where: { ownerId } });
  if (existing) throw new ApiError(409, "You already have a store");

  const slug = generateSlug(data.name);

  // check slug is unique
  const slugExists = await prisma.store.findUnique({ where: { slug } });
  if (slugExists) throw new ApiError(409, "Store name already taken, try a different name");

  return prisma.store.create({
    data: { ...data, slug, ownerId },
  });
};

// PUBLIC — get all active stores
export const getAllStores = async () => {
  return prisma.store.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      logo: true,
      owner: { select: { id: true, name: true } },
      _count: { select: { products: true } },
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
};

// PUBLIC — get single store with products
export const getStoreById = async (id: string) => {
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
          images: { take: 1 }, // just first image for listing
        },
      },
    },
  });
  if (!store) throw new ApiError(404, "Store not found");
  return store;
};

// VENDOR — update own store only
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

  return prisma.store.update({
    where: { id: storeId },
    data,
  });
};

// ADMIN — delete any store
export const deleteStore = async (id: string) => {
  const store = await prisma.store.findUnique({ where: { id } });
  if (!store) throw new ApiError(404, "Store not found");

  await prisma.store.delete({ where: { id } });
  return { message: "Store deleted successfully" };
};

// VENDOR — get their own store
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