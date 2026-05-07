import { Prisma } from '@prisma/client';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: true;
    category: true;
    brand: true;
  };
}>;

type ProductListWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    brand: true;
    variants: true,
    orderCount: true,
    rating: true,
    reviewCount: true,
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

export const formatProductListResponse = (product: ProductListWithRelations) => ({
  id: product.id,
  slug: product.slug,
  name: product.name,

  image: product.images?.[0]?.url ?? null,

  price: product.price,
  originalPrice: product.originalPrice,

  rating: product.rating,
  reviewCount: product.reviewCount,

  createdAt: product.createdAt,

  categoryId: product.categoryId,
  categoryName: product.category?.name ?? "",

  brandId: product.brandId,
  brandName: product.brand?.name ?? "",

  orderCount: product.orderCount,
});