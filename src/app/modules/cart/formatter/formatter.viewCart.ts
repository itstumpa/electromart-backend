import { Prisma } from "@prisma/client";

export type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: {
    product: {
      include: {
        images: true;
        store: { select: { id: true; name: true; slug: true } };
      };
    };
    variant: true;
  };
}>;

export const formatCartItemResponse = (item: CartItemWithRelations) => ({
  id: item.id,

  quantity: item.quantity,

  productId: item.product.id,

  productSlug: item.product.slug ?? "",

  productName: item.product.name,

  productImage: item.product.images?.[0]?.url ?? "",

  vendorName: item.product.store.name,

  price: item.product.price,

  stock: item.product.stock,

  // Expose the variant object so the frontend cart mapper can extract
  // both variant.id (for cart operations) and variant.name (for display).
  variant: item.variant
    ? { id: item.variant.id, name: `${item.variant.name}: ${item.variant.value}` }
    : undefined,
});