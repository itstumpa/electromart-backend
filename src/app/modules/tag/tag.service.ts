// src/app/modules/tag/tag.service.ts
import { prisma } from '../../../lib/prisma';
import ApiError from '../../../utils/apiErrors';

const generateSlug = (name: string) =>
  name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

// ADMIN — create tag
export const createTag = async (name: string) => {
  const slug = generateSlug(name);
  const existing = await prisma.tag.findUnique({ where: { slug } });
  if (existing) throw new ApiError(409, 'Tag already exists');
  return prisma.tag.create({ data: { name, slug } });
};

// PUBLIC — get all tags
export const getAllTags = async () => {
  return prisma.tag.findMany({ orderBy: { name: 'asc' } });
};

// ADMIN — delete tag
export const deleteTag = async (id: string) => {
  const tag = await prisma.tag.findUnique({ where: { id } });
  if (!tag) throw new ApiError(404, 'Tag not found');
  await prisma.tag.delete({ where: { id } });
  return { message: 'Tag deleted' };
};

// VENDOR — add tags to their product
export const addTagsToProduct = async (productId: string, ownerId: string, tagIds: string[]) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'You can only tag your own products');
  }

  // upsert — skip already existing
  await prisma.productTag.createMany({
    data: tagIds.map((tagId) => ({ productId, tagId })),
    skipDuplicates: true,
  });

  return prisma.product.findUnique({
    where: { id: productId },
    include: { tags: { include: { tag: true } } },
  });
};

// VENDOR — remove tag from product
export const removeTagFromProduct = async (productId: string, tagId: string, ownerId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { store: true },
  });
  if (!product) throw new ApiError(404, 'Product not found');
  if (product.store.ownerId !== ownerId) {
    throw new ApiError(403, 'Access denied');
  }

  await prisma.productTag.delete({
    where: { productId_tagId: { productId, tagId } },
  });

  return { message: 'Tag removed from product' };
};

// PUBLIC — get products by tag slug
export const getProductsByTag = async (slug: string) => {
  const tag = await prisma.tag.findUnique({
    where: { slug },
    include: {
      products: {
        where: {
          product: {
            isActive: true,
          },
        },
        include: {
          product: {
            include: {
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
      },
    },
  });

  if (!tag) throw new ApiError(404, 'Tag not found');

  return tag;
};
