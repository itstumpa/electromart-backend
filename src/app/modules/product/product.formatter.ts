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


export const formatProductResponse = (product: ProductWithRelations) => ({
  id: product.id,
  name: product.name,
  slug: product.slug ?? "",

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

export const formatProductDetailResponse = (product: ProductDetailWithRelations ) => ({
  id: product.id,
  name: product.name,
  slug: product.slug ?? "",
  description: product.description,
  price: product.price,
  originalPrice: product.originalPrice,
  stock: product.stock,
  rating: product.rating,
  reviewCount: product.reviewCount,
  featured: product.featured,
  bestseller: product.bestseller,
  tags: product.tags.map(t => t.tag.name),

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
});
