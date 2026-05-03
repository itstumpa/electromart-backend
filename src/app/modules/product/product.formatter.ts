import { Prisma } from '@prisma/client';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: true;
    category: true;
  };
}>;

export const formatProductResponse = (product: ProductWithRelations) => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  description: product.description,
  price: product.price,
  stock: product.stock,
  isActive: product.isActive,
  createdAt: product.createdAt,


  images: product.images.map((img) => ({
    id: img.id,
    url: img.url,
  })),

  variants: product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    value: variant.value,
    price: variant.price,
    stock: variant.stock,
  })),

  category: {
    id: product.category.id,
    name: product.category.name,
    slug: product.category.slug,
  },
});