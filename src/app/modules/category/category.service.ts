import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
import {
  getOrSetCache,
  invalidateCache,
} from "../../../utils/cache";
import { CacheKeys } from "../../../utils/cacheKeys";

const generateSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

// ADMIN — create
export const createCategory = async (name: string) => {
  const slug = generateSlug(name);

  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ApiError(409, "Category already exists");
  }

  const category = await prisma.category.create({
    data: { name, slug },
  });

  await invalidateCache(CacheKeys.ALL_CATEGORIES);

  return category;
};

// PUBLIC — get all
export const getAllCategories = async () => {
  return getOrSetCache(
    CacheKeys.ALL_CATEGORIES,
    3600, // 1 hour
    () =>
      prisma.category.findMany({
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      })
  );
};

// PUBLIC — get single
export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      products: {
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          price: true,
          images: { take: 1 },
          store: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return category;
};

// ADMIN — update
export const updateCategory = async (id: string, name: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  const slug = generateSlug(name);

  const slugExists = await prisma.category.findFirst({
    where: {
      slug,
      NOT: { id },
    },
  });

  if (slugExists) {
    throw new ApiError(409, "Category name already taken");
  }

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: { name, slug },
  });

  await invalidateCache(CacheKeys.ALL_CATEGORIES);

  return updatedCategory;
};

// ADMIN — delete
export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  if (category._count.products > 0) {
    throw new ApiError(
      400,
      `Cannot delete — ${category._count.products} products are using this category`
    );
  }

  await prisma.category.delete({
    where: { id },
  });

  await invalidateCache(CacheKeys.ALL_CATEGORIES);

  return {
    message: "Category deleted successfully",
  };
};