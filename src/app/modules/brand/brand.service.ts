import { prisma } from '../../../lib/prisma';
import { generateUniqueSlug } from '../../../utils/generateUniqueSlug';
import { getOrSetCache, invalidateCache } from '../../../utils/cache';
import { CacheKeys } from '../../../utils/cacheKeys';

export const getAllBrands = async () => {
  return prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

export const getFeaturedBrands = async () => {
  const brands = await getOrSetCache(
    CacheKeys.FEATURED_BRANDS,
    3600,
    () =>
      prisma.brand.findMany({
        where: { isFeatured: true },
        include: { _count: { select: { products: true } } },
        orderBy: { createdAt: 'desc' },
      }),
  );

  return brands;
};

export const getBrandById = async (id: string) => {
  return prisma.brand.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
};

export const createBrand = async (data: {
  name: string;
  slug?: string;
  logo?: string;
  description?: string;
  isFeatured?: boolean;
}) => {
const slug = data.slug || (await generateUniqueSlug(data.name, prisma.brand));
  const brand = await prisma.brand.create({ data: { ...data, slug, isFeatured: data.isFeatured ?? false } });
  await invalidateCache(CacheKeys.FEATURED_BRANDS);
  return brand;
};

export const updateBrand = async (
  id: string,
  data: { name?: string; slug?: string; logo?: string; description?: string; isFeatured?: boolean }
) => {
  const brand = await prisma.brand.update({ where: { id }, data });
  await invalidateCache(CacheKeys.FEATURED_BRANDS);
  return brand;
};

export const deleteBrand = async (id: string) => {
  await prisma.brand.delete({ where: { id } });
  await invalidateCache(CacheKeys.FEATURED_BRANDS);
};