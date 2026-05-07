import { Prisma } from "@prisma/client";

export type CartItemWithRelations = Prisma.CartItemGetPayload<{
  include: {
    product: {
      select: {
        id: true;
        name: true;
        slug: true;
        price: true;
        stock: true;
        images: { select: { url: true } };
        store: { select: { name: true } };
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
});