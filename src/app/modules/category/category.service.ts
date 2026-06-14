import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";
import {
  getOrSetCache,
  invalidateCache,
} from "../../../utils/cache";
import { CacheKeys } from "../../../utils/cacheKeys";
import { Request, Response } from 'express';

const generateSlug = (name: string) =>
  name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

type CategoryWithCount = {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  createdAt: Date;
  updatedAt?: Date;
  _count: { products: number };
};

const formatCategoryForFrontend = (cat: CategoryWithCount) => ({
  id: cat.id,
  name: cat.name,
  slug: cat.slug,
  image: cat.image ?? undefined,
  createdAt: cat.createdAt,
  ...(cat.updatedAt && { updatedAt: cat.updatedAt }),
  _count: {
    products: cat._count.products,
  },
});



// ADMIN — create
export const createCategory = async (name: string, image: string, isFeatured?: boolean) => {
  const slug = generateSlug(name);

  const existing = await prisma.category.findUnique({
    where: { slug },
  });

  if (existing) {
    throw new ApiError(409, "Category already exists");
  }

  const category = await prisma.category.create({
    data: { name, slug, image, isFeatured: isFeatured ?? false },
  });

  await invalidateCache(CacheKeys.ALL_CATEGORIES);
  await invalidateCache(CacheKeys.FEATURED_CATEGORIES);

  return category;
};

// PUBLIC — get all
export const getAllCategories = async () => {
  const categories = await getOrSetCache(
    CacheKeys.ALL_CATEGORIES,
    3600,
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

  return categories.map(formatCategoryForFrontend);
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

// PUBLIC — get by slug
export const getCategoryBySlug = async (slug: string) => {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  if (!category) {
    throw new ApiError(404, "Category not found");
  }

  return {
    ...formatCategoryForFrontend(category),
    description: null as string | null,
  };
};

// ADMIN — update
export const updateCategory = async (
  id: string,
  name: string,
  image?: string,
  isFeatured?: boolean
) => {
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
    data: {
      name,
      slug,
      ...(image && { image }),
      ...(isFeatured !== undefined && { isFeatured }),
    },
  });

  await invalidateCache(CacheKeys.ALL_CATEGORIES);
  await invalidateCache(CacheKeys.FEATURED_CATEGORIES);

  return updatedCategory;
};

// PUBLIC — get featured
export const getFeaturedCategories = async () => {
  const categories = await getOrSetCache(
    CacheKeys.FEATURED_CATEGORIES,
    3600,
    () =>
      prisma.category.findMany({
        where: { isFeatured: true },
        orderBy: { name: "asc" },
        include: {
          _count: {
            select: { products: true },
          },
        },
      }),
  );

  return categories.map(formatCategoryForFrontend);
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
  await invalidateCache(CacheKeys.FEATURED_CATEGORIES);

  return {
    message: "Category deleted successfully",
  };
};