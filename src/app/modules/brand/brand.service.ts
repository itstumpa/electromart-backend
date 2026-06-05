import { prisma } from '../../../lib/prisma';
import { generateUniqueSlug } from '../../../utils/generateUniqueSlug';

export const getAllBrands = async () => {
  return prisma.brand.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { createdAt: 'desc' },
  });
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
}) => {
const slug = data.slug || (await generateUniqueSlug(data.name, prisma.brand));
  return prisma.brand.create({ data: { ...data, slug } });
};

export const updateBrand = async (
  id: string,
  data: { name?: string; slug?: string; logo?: string; description?: string }
) => {
  return prisma.brand.update({ where: { id }, data });
};

export const deleteBrand = async (id: string) => {
  return prisma.brand.delete({ where: { id } });
};