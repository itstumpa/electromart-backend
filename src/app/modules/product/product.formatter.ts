import { Prisma } from '@prisma/client';

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: true;
    specifications: true;
    category: true;
    brand: true;
  };
}>;

type ProductListWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    category: true;
    brand: true;
    variants: true;
  }
}> & {
  store: { id: string; name: string; slug: string };
};

type ProductDetailWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    variants: true;
    category: true;
    brand: true;
    tags: {
      include: {
        tag: true;
      };
    };
    specifications: true;
  };
}> & {
  store: { id: string; name: string; slug: string };
};

type ProductDetailDTO = {
  id: string;
  name: string;
  slug: string;

  description: string | null;
  details: string | null;

  price: Prisma.Decimal;
  originalPrice: Prisma.Decimal | null;

  stock: number;

  rating: number;
  reviewCount: number;

  featured: boolean;
  bestseller: boolean;

  tags: string[];

  images: { id: string; url: string }[];

  brand: {
    id: string;
    name: string;
    slug: string;
  } | null;

  category: {
    id: string;
    name: string;
    slug: string;
  };

  variants: {
    id: string;
    name: string;
    value: string;
    stock: number;
    price: Prisma.Decimal | null;
  }[];

  store: {
    id: string;
    name: string;
    slug: string;
  };

  specifications: {
    key: string;
    value: string;
  }[];

  createdAt: Date;
};

type ProductCardWithRelations = Prisma.ProductGetPayload<{
  include: {
    images: true;
    brand: true;
  };
}>;

export const PRODUCT_LIST_INCLUDE = {
  images: true,
  category: { select: { id: true, name: true, slug: true } },
  store: { select: { id: true, name: true, slug: true } },
  brand: { select: { id: true, name: true, slug: true } },
} as const;

type ProductListItemRelations = Prisma.ProductGetPayload<{
  select: {
    id: true; name: true; slug: true; description: true;
    price: true; originalPrice: true; stock: true;
    storeId: true; categoryId: true; isActive: true;
    rating: true; reviewCount: true; featured: true; bestseller: true;
    createdAt: true; updatedAt: true;
    images: { select: { id: true; url: true } };
    category: { select: { id: true; name: true; slug: true } };
    store: { select: { id: true; name: true; slug: true } };
    brand: { select: { id: true; name: true; slug: true } };
  };
}>;


export const formatProductResponse = (product: ProductWithRelations) => ({
  id: product.id,
  name: product.name,
  slug: product.slug ?? "",

  description: product.description,
  details: product.details,
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

    specifications: product.specifications.map((spec) => ({
    id: spec.id,
    key: spec.key,
    value: spec.value,
  })),

  category: {
    id: product.category.id,
    name: product.category.name,
    slug: product.category.slug,
  },

    brand: product.brand
    ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug,
      }
    : null,
});

/** Frontend ProductListItemDto contract */
export const formatProductListItemResponse = (product: ProductListItemRelations) => ({
  id: product.id,
  name: product.name,
  slug: product.slug ?? "",
  description: product.description,
  details: product.details ?? null,
  price: product.price,
  originalPrice: product.originalPrice ?? null,
  stock: product.stock,
  storeId: product.storeId,
  categoryId: product.categoryId,
  isActive: product.isActive,
  featured: product.featured ?? false,
  bestseller: product.bestseller ?? false,
  rating: product.rating,
  reviewCount: product.reviewCount,
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
  images: product.images.map((img) => ({
    id: img.id,
    url: img.url,
  })),
  category: {
    id: product.category.id,
    name: product.category.name,
    slug: product.category.slug,
  },
  store: {
    id: product.store.id,
    name: product.store.name,
    slug: product.store.slug,
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

export const formatProductDetailResponse = (product: ProductDetailWithRelations) => ({
  id: product.id,
  name: product.name,
  slug: product.slug ?? "",
  description: product.description,
  details: product.details,
  price: product.price,
  originalPrice: product.originalPrice,
  stock: product.stock,
  storeId: product.storeId,
  categoryId: product.categoryId,
  isActive: product.isActive,
  rating: product.rating,
  reviewCount: product.reviewCount,
  featured: product.featured,
  bestseller: product.bestseller,
  tags: product.tags.map((t) => t.tag.name),
  image: product.images?.[0]?.url ?? null,
  images: product.images?.map((img) => ({ id: img.id, url: img.url })) || [],
  brand: product.brand
    ? {
        id: product.brand.id,
        name: product.brand.name,
        slug: product.brand.slug ?? "",
      }
    : null,
  category: {
    id: product.category?.id || "",
    name: product.category?.name || "",
    slug: product.category?.slug || "",
  },
  specifications: product.specifications ?? [],
  variants: product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    value: v.value,
    price: v.price,
    stock: v.stock,
  })),
  store: {
    id: product.store.id,
    name: product.store.name,
    slug: product.store.slug,
  },
  createdAt: product.createdAt,
  updatedAt: product.updatedAt,
});

export const formatProductCardResponse = (
  product: ProductCardWithRelations
) => ({
  id: product.id,

  slug: product.slug ?? "",

  name: product.name,

  image: product.images?.[0]?.url ?? null,

  price: product.price,
  originalPrice: product.originalPrice,

  stock: product.stock,

  rating: product.rating,
  reviewCount: product.reviewCount,

  brandName: product.brand?.name ?? null,

  featured: product.featured,
  bestseller: product.bestseller,
});
