import { prisma } from "../../../lib/prisma";
import ApiError from "../../../utils/apiErrors";

const productSelect = {
  id: true,
  name: true,
  slug: true,
  price: true,
  originalPrice: true,
  stock: true,
  rating: true,
  images: { take: 1, select: { url: true } },
} as const;

const getOrCreateWishlist = async (userId: string) => {
  let wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) {
    wishlist = await prisma.wishlist.create({ data: { userId } });
  }
  return wishlist;
};

const formatWishlistItem = (item: {
  id: string;
  createdAt: Date;
  product: {
    id: string;
    name: string;
    slug: string;
    price: { toString(): string } | number | bigint;
    originalPrice: { toString(): string } | number | bigint | null;
    stock: number;
    rating: number;
    images: { url: string }[];
  };
}) => ({
  id: item.id,
  productId: item.product.id,
  productSlug: item.product.slug,
  productName: item.product.name,
  productImage: item.product.images[0]?.url ?? "",
  price: Number(item.product.price),
  originalPrice: item.product.originalPrice
    ? Number(item.product.originalPrice)
    : null,
  rating: item.product.rating,
  stock: item.product.stock,
  addedAt: item.createdAt,
});

export const getWishlist = async (userId: string) => {
  const wishlist = await getOrCreateWishlist(userId);
  const items = await prisma.wishlistItem.findMany({
    where: { wishlistId: wishlist.id },
    include: { product: { select: productSelect } },
    orderBy: { createdAt: "desc" },
  });
  return items.map(formatWishlistItem);
};

export const addToWishlist = async (userId: string, productId: string) => {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, isActive: true },
  });
  if (!product || !product.isActive) {
    throw new ApiError(404, "Product not found");
  }

  const wishlist = await getOrCreateWishlist(userId);

  const existing = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: { wishlistId: wishlist.id, productId },
    },
  });
  if (existing) {
    throw new ApiError(409, "Product already in wishlist");
  }

  await prisma.wishlistItem.create({
    data: { wishlistId: wishlist.id, productId },
  });

  return getWishlist(userId);
};

export const removeFromWishlist = async (userId: string, productId: string) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) throw new ApiError(404, "Wishlist not found");

  const item = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: { wishlistId: wishlist.id, productId },
    },
  });
  if (!item) throw new ApiError(404, "Item not in wishlist");

  await prisma.wishlistItem.delete({ where: { id: item.id } });
  return getWishlist(userId);
};

export const clearWishlist = async (userId: string) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return { message: "Wishlist cleared" };

  await prisma.wishlistItem.deleteMany({ where: { wishlistId: wishlist.id } });
  return { message: "Wishlist cleared" };
};

export const checkWishlistItem = async (userId: string, productId: string) => {
  const wishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!wishlist) return { inWishlist: false };

  const item = await prisma.wishlistItem.findUnique({
    where: {
      wishlistId_productId: { wishlistId: wishlist.id, productId },
    },
  });
  return { inWishlist: Boolean(item) };
};
