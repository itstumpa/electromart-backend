/**
 * ElectroMart — database seed from frontend mock data.
 * Run: npx prisma db seed  (or npm run seed)
 */
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import path from "path";
import {
  OrderItemStatus,
  OrderStatus,
  PaymentGateway,
  PaymentStatus,
  Prisma,
  PrismaClient,
  Role,
} from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  mockAddresses,
  mockBrands,
  mockCart,
  mockCategories,
  mockNotifications,
  mockOrders,
  mockProducts,
  mockReviews,
  mockUsers,
  mockVendorProfiles,
  mockWishlist,
} from "../../electromart-frontend/data/mock-data";

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is missing in .env");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo@1234";

const counts = {
  users: 0,
  stores: 0,
  categories: 0,
  brands: 0,
  products: 0,
  productImages: 0,
  productVariants: 0,
  productSpecifications: 0,
  tags: 0,
  productTags: 0,
  reviews: 0,
  addresses: 0,
  orders: 0,
  orderItems: 0,
  orderAddresses: 0,
  payments: 0,
  orderStatusHistory: 0,
  carts: 0,
  cartItems: 0,
  notifications: 0,
  wishlists: 0,
  wishlistItems: 0,
};

const hashPassword = (plain: string) => bcrypt.hash(plain, 10);

const toDecimal = (value: number) => new Prisma.Decimal(value);

const slugify = (text: string) =>
  text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const mapRole = (role: string): Role => {
  if (role === "SUPER_ADMIN") return "SUPER_ADMIN";
  if (role === "VENDOR") return "VENDOR";
  if (role === "ADMIN") return "ADMIN";
  return "CUSTOMER";
};

const mapOrderStatus = (status: string): OrderStatus => {
  switch (status) {
    case "pending":
      return "PENDING";
    case "confirmed":
    case "processing":
      return "PROCESSING";
    case "shipped":
    case "out_for_delivery":
      return "SHIPPED";
    case "delivered":
      return "DELIVERED";
    case "cancelled":
    case "refunded":
      return "CANCELLED";
    default:
      return "PENDING";
  }
};

const mapOrderItemStatus = (status: OrderStatus): OrderItemStatus => {
  if (status === "CANCELLED") return "CANCELLED";
  if (status === "DELIVERED") return "DELIVERED";
  if (status === "SHIPPED") return "SHIPPED";
  if (status === "PROCESSING") return "PROCESSING";
  return "PENDING";
};

const mapPaymentStatus = (status: string): PaymentStatus => {
  switch (status) {
    case "paid":
      return "PAID";
    case "failed":
      return "FAILED";
    case "refunded":
      return "REFUNDED";
    default:
      return "PENDING";
  }
};

const mapPaymentGateway = (method: string): PaymentGateway => {
  if (method === "SSLCommerz") return "SSLCOMMERZ";
  if (method === "BKASH") return "BKASH";
  return "MANUAL";
};

const mapNotificationType = (type: string): string => type.toUpperCase();

const productIsActive = (product: (typeof mockProducts)[0]): boolean => {
  if (product.status === "draft") return false;
  if (!product.isPublished) return false;
  return true;
};

async function seedUsers(hashedPassword: string) {
  const seedable = mockUsers.filter((u) => u.role !== "DELIVERY");

  for (const user of seedable) {
    await prisma.user.upsert({
      where: { email: user.email },
      create: {
        id: user.id,
        name: user.name,
        email: user.email,
        password: hashedPassword,
        role: mapRole(user.role),
        isEmailVerified: user.isVerified,
        phone: user.phone ?? null,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
      },
      update: {
        name: user.name,
        password: hashedPassword,
        role: mapRole(user.role),
        isEmailVerified: user.isVerified,
        phone: user.phone ?? null,
        updatedAt: new Date(user.updatedAt),
      },
    });
    counts.users += 1;
  }
}

async function seedStores(): Promise<Map<string, string>> {
  const vendorIdToStoreId = new Map<string, string>();

  for (const profile of mockVendorProfiles) {
    const storeId = `store-${profile.id}`;
    const slug = slugify(profile.storeName);

    await prisma.store.upsert({
      where: { ownerId: profile.userId },
      create: {
        id: storeId,
        name: profile.storeName,
        slug,
        description: profile.bio ?? null,
        logo: profile.logo ?? null,
        coverImage: profile.coverImage ?? null,
        specialty: profile.specialty ?? null,
        badge: profile.badge ?? null,
        offers: profile.offers ?? null,
        ownerId: profile.userId,
        isActive: profile.isApproved,
        isApproved: profile.isApproved,
        totalSales: profile.totalSales,
        rating: profile.rating,
        isFeatured: profile.id === 'vendor-1',
        createdAt: new Date(profile.createdAt),
      },
      update: {
        name: profile.storeName,
        slug,
        description: profile.bio ?? null,
        logo: profile.logo ?? null,
        coverImage: profile.coverImage ?? null,
        specialty: profile.specialty ?? null,
        badge: profile.badge ?? null,
        offers: profile.offers ?? null,
        isActive: profile.isApproved,
        isApproved: profile.isApproved,
        totalSales: profile.totalSales,
        rating: profile.rating,
      },
    });

    vendorIdToStoreId.set(profile.id, storeId);
    counts.stores += 1;
  }

  return vendorIdToStoreId;
}

async function seedCategories(): Promise<Map<string, string>> {
  const categoryIdMap = new Map<string, string>();
  const featuredCategoryIds = new Set(
    mockProducts.filter((p) => p.featured).map((p) => p.categoryId),
  );

  for (const category of mockCategories) {
    const existing = await prisma.category.findFirst({
      where: {
        OR: [
          { id: category.id },
          { slug: category.slug },
          { name: category.name },
        ],
      },
    });

    const isFeatured = featuredCategoryIds.has(category.id);

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: category.name,
          slug: category.slug,
          image: category.image,
          isFeatured,
        },
      });
      categoryIdMap.set(category.id, existing.id);
    } else {
      await prisma.category.create({
        data: {
          id: category.id,
          name: category.name,
          slug: category.slug,
          image: category.image,
          isFeatured,
          createdAt: new Date(category.createdAt),
        },
      });
      categoryIdMap.set(category.id, category.id);
    }
    counts.categories += 1;
  }

  return categoryIdMap;
}

async function seedBrands(): Promise<Map<string, string>> {
  const brandIdMap = new Map<string, string>();

  for (const brand of mockBrands) {
    const existing = await prisma.brand.findFirst({
      where: {
        OR: [{ id: brand.id }, { slug: brand.slug }, { name: brand.name }],
      },
    });

    if (existing) {
      await prisma.brand.update({
        where: { id: existing.id },
        data: { name: brand.name, slug: brand.slug },
      });
      brandIdMap.set(brand.id, existing.id);
    } else {
      await prisma.brand.create({
        data: {
          id: brand.id,
          name: brand.name,
          slug: brand.slug,
        },
      });
      brandIdMap.set(brand.id, brand.id);
    }
    counts.brands += 1;
  }

  return brandIdMap;
}

async function seedProducts(
  vendorIdToStoreId: Map<string, string>,
  categoryIdMap: Map<string, string>,
  brandIdMap: Map<string, string>,
) {
  for (const product of mockProducts) {
    const storeId = vendorIdToStoreId.get(product.vendorId);
    if (!storeId) {
      throw new Error(
        `No store for product ${product.id} (vendorId ${product.vendorId})`,
      );
    }

    const categoryId =
      categoryIdMap.get(product.categoryId) ?? product.categoryId;
    const brandId = brandIdMap.get(product.brandId) ?? product.brandId;

    await prisma.product.upsert({
      where: { id: product.id },
      create: {
        id: product.id,
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: toDecimal(product.price),
        originalPrice:
          product.originalPrice != null
            ? toDecimal(product.originalPrice)
            : null,
        stock: product.stock,
        storeId,
        categoryId,
        brandId,
        isActive: productIsActive(product),
        featured: product.featured,
        bestseller: product.bestseller,
        rating: product.rating,
        reviewCount: product.reviewCount,
        orderCount: 0,
        createdAt: new Date(product.createdAt),
        updatedAt: new Date(product.updatedAt),
      },
      update: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: toDecimal(product.price),
        originalPrice:
          product.originalPrice != null
            ? toDecimal(product.originalPrice)
            : null,
        stock: product.stock,
        storeId,
        categoryId,
        brandId,
        isActive: productIsActive(product),
        featured: product.featured,
        bestseller: product.bestseller,
        rating: product.rating,
        reviewCount: product.reviewCount,
        updatedAt: new Date(product.updatedAt),
      },
    });
    counts.products += 1;

    await prisma.productImage.deleteMany({ where: { productId: product.id } });
    const imageUrls = [
      ...new Set(
        [product.image, ...(product.images ?? [])].filter(Boolean),
      ),
    ];
    for (let i = 0; i < imageUrls.length; i += 1) {
      await prisma.productImage.create({
        data: {
          id: `img-${product.id}-${i}`,
          url: imageUrls[i],
          productId: product.id,
          publicId: null,
        },
      });
      counts.productImages += 1;
    }

    await prisma.productSpecification.deleteMany({
      where: { productId: product.id },
    });
    for (let i = 0; i < product.specifications.length; i += 1) {
      const spec = product.specifications[i];
      await prisma.productSpecification.create({
        data: {
          id: `spec-${product.id}-${i}`,
          key: spec.label,
          value: spec.value,
          productId: product.id,
        },
      });
      counts.productSpecifications += 1;
    }

    if (product.variants?.length) {
      for (const variant of product.variants) {
        const variantPrice =
          variant.priceModifier === 0
            ? null
            : toDecimal(product.price + variant.priceModifier);

        await prisma.productVariant.upsert({
          where: { id: variant.id },
          create: {
            id: variant.id,
            name: variant.name,
            value: variant.value,
            price: variantPrice,
            stock: variant.stock,
            productId: product.id,
          },
          update: {
            name: variant.name,
            value: variant.value,
            price: variantPrice,
            stock: variant.stock,
          },
        });
        counts.productVariants += 1;
      }
    }

    await prisma.productTag.deleteMany({ where: { productId: product.id } });
    for (const tagName of product.tags ?? []) {
      const tagSlug = slugify(tagName);
      await prisma.tag.upsert({
        where: { slug: tagSlug },
        create: {
          id: `tag-${tagSlug}`,
          name: tagName,
          slug: tagSlug,
        },
        update: { name: tagName },
      });
      counts.tags += 1;

      const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
      if (tag) {
        await prisma.productTag.upsert({
          where: {
            productId_tagId: { productId: product.id, tagId: tag.id },
          },
          create: { productId: product.id, tagId: tag.id },
          update: {},
        });
        counts.productTags += 1;
      }
    }
  }
}

async function seedReviews() {
  for (const review of mockReviews) {
    await prisma.review.upsert({
      where: { id: review.id },
      create: {
        id: review.id,
        customerId: review.customerId,
        productId: review.productId,
        rating: review.rating,
        comment: review.comment,
        createdAt: new Date(review.createdAt),
        updatedAt: new Date(review.updatedAt),
      },
      update: {
        rating: review.rating,
        comment: review.comment,
        updatedAt: new Date(review.updatedAt),
      },
    });
    counts.reviews += 1;
  }
}

async function seedAddresses() {
  for (const address of mockAddresses) {
    const label =
      address.label.charAt(0).toUpperCase() + address.label.slice(1);

    await prisma.address.upsert({
      where: { id: address.id },
      create: {
        id: address.id,
        userId: address.userId,
        label,
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state ?? null,
        country: address.country,
        zipCode: address.zipCode,
        isDefault: address.isDefault,
      },
      update: {
        label,
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        city: address.city,
        state: address.state ?? null,
        country: address.country,
        zipCode: address.zipCode,
        isDefault: address.isDefault,
      },
    });
    counts.addresses += 1;
  }
}

async function seedOrders(vendorIdToStoreId: Map<string, string>) {
  const productStoreMap = new Map(
    mockProducts.map((p) => [
      p.id,
      vendorIdToStoreId.get(p.vendorId) ?? "",
    ]),
  );

  for (const order of mockOrders) {
    const orderStatus = mapOrderStatus(order.status);
    const itemStatus = mapOrderItemStatus(orderStatus);

    await prisma.order.upsert({
      where: { id: order.id },
      create: {
        id: order.id,
        userId: order.customerId,
        status: orderStatus,
        subtotal: toDecimal(order.subtotal),
        shippingCost: toDecimal(order.shippingCost),
        tax: toDecimal(order.tax),
        discount: toDecimal(order.discount),
        total: toDecimal(order.total),
        currency: "TK",
        couponId: null,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt),
      },
      update: {
        status: orderStatus,
        subtotal: toDecimal(order.subtotal),
        shippingCost: toDecimal(order.shippingCost),
        tax: toDecimal(order.tax),
        discount: toDecimal(order.discount),
        total: toDecimal(order.total),
        updatedAt: new Date(order.updatedAt),
      },
    });
    counts.orders += 1;

    await prisma.orderItem.deleteMany({ where: { orderId: order.id } });
    for (const item of order.items) {
      const storeId = productStoreMap.get(item.productId);
      if (!storeId) {
        throw new Error(`No store for order item product ${item.productId}`);
      }

      const itemId = `oi-${order.id}-${item.productId}`;
      await prisma.orderItem.create({
        data: {
          id: itemId,
          orderId: order.id,
          productId: item.productId,
          storeId,
          quantity: item.quantity,
          productImage: item.productImage,
          variant: item.variant ?? null,
          priceAtTime: toDecimal(item.price),
          status: itemStatus,
          createdAt: new Date(order.createdAt),
        },
      });
      counts.orderItems += 1;
    }

    const addr = order.shippingAddress;
    await prisma.orderAddress.upsert({
      where: { orderId: order.id },
      create: {
        id: `oaddr-${order.id}`,
        orderId: order.id,
        fullName: addr.fullName,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
      },
      update: {
        fullName: addr.fullName,
        phone: addr.phone,
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zipCode,
        country: addr.country,
      },
    });
    counts.orderAddresses += 1;

    const paymentStatus = mapPaymentStatus(order.paymentStatus);
    await prisma.payment.upsert({
      where: { orderId: order.id },
      create: {
        id: `pay-${order.id}`,
        orderId: order.id,
        status: paymentStatus,
        gateway: mapPaymentGateway(order.paymentMethod),
        amount: toDecimal(order.total),
        currency: "BDT",
        transactionId: `seed-${order.id}`,
        provider:
          order.paymentMethod === "SSLCommerz" ? "sslcommerz" : "manual",
      },
      update: {
        status: paymentStatus,
        gateway: mapPaymentGateway(order.paymentMethod),
        amount: toDecimal(order.total),
      },
    });
    counts.payments += 1;

    await prisma.orderStatusHistory.deleteMany({ where: { orderId: order.id } });
    const historyNote =
      order.note ?? `Order status: ${orderStatus}`;
    await prisma.orderStatusHistory.create({
      data: {
        id: `osh-${order.id}-1`,
        orderId: order.id,
        status: orderStatus,
        note: historyNote,
        createdAt: new Date(order.updatedAt),
      },
    });
    counts.orderStatusHistory += 1;

    if (orderStatus === "DELIVERED" || orderStatus === "SHIPPED") {
      await prisma.orderStatusHistory.create({
        data: {
          id: `osh-${order.id}-0`,
          orderId: order.id,
          status: "PENDING",
          note: "Order placed",
          createdAt: new Date(order.createdAt),
        },
      });
      counts.orderStatusHistory += 1;
    }
  }
}

async function seedCart() {
  const cartId = `cart-${mockCart.userId}`;

  await prisma.cart.upsert({
    where: { userId: mockCart.userId },
    create: {
      id: cartId,
      userId: mockCart.userId,
      createdAt: new Date(mockCart.updatedAt),
      updatedAt: new Date(mockCart.updatedAt),
    },
    update: {
      updatedAt: new Date(mockCart.updatedAt),
    },
  });
  counts.carts += 1;

  for (const item of mockCart.items) {
    let variantId: string | null = null;
    if (item.variant) {
      const variant = await prisma.productVariant.findFirst({
        where: {
          productId: item.productId,
          value: item.variant,
        },
      });
      variantId = variant?.id ?? null;
    }

    await prisma.cartItem.upsert({
      where: {
        cartId_productId: {
          cartId,
          productId: item.productId,
        },
      },
      create: {
        id: item.id,
        cartId,
        productId: item.productId,
        variantId,
        quantity: item.quantity,
      },
      update: {
        variantId,
        quantity: item.quantity,
      },
    });
    counts.cartItems += 1;
  }
}

async function seedWishlist() {
  const customerId = "user-cust-1";
  const wishlist = await prisma.wishlist.upsert({
    where: { userId: customerId },
    create: { userId: customerId },
    update: {},
  });
  counts.wishlists += 1;

  for (const item of mockWishlist) {
    await prisma.wishlistItem.upsert({
      where: {
        wishlistId_productId: {
          wishlistId: wishlist.id,
          productId: item.productId,
        },
      },
      create: {
        wishlistId: wishlist.id,
        productId: item.productId,
      },
      update: {},
    });
    counts.wishlistItems += 1;
  }
}

async function seedNotifications() {
  for (const notification of mockNotifications) {
    if (notification.userId === "user-delivery-1") {
      continue;
    }
    if (notification.type === "delivery") {
      continue;
    }

    await prisma.notification.upsert({
      where: { id: notification.id },
      create: {
        id: notification.id,
        userId: notification.userId,
        title: notification.title,
        message: notification.message,
        type: mapNotificationType(notification.type),
        isRead: notification.isRead,
        createdAt: new Date(notification.createdAt),
      },
      update: {
        title: notification.title,
        message: notification.message,
        type: mapNotificationType(notification.type),
        isRead: notification.isRead,
      },
    });
    counts.notifications += 1;
  }
}

async function main() {
  console.log("\n🌱 ElectroMart mock data seed\n");
  console.log(`   Demo password: ${DEMO_PASSWORD}\n`);

  const hashedPassword = await hashPassword(DEMO_PASSWORD);

  await seedUsers(hashedPassword);
  console.log(`✅ Users: ${counts.users}`);

  const vendorIdToStoreId = await seedStores();
  console.log(`✅ Stores: ${counts.stores}`);

  const categoryIdMap = await seedCategories();
  console.log(`✅ Categories: ${counts.categories}`);

  const brandIdMap = await seedBrands();
  console.log(`✅ Brands: ${counts.brands}`);

  await seedProducts(vendorIdToStoreId, categoryIdMap, brandIdMap);
  console.log(
    `✅ Products: ${counts.products} (images: ${counts.productImages}, variants: ${counts.productVariants}, specs: ${counts.productSpecifications}, tags: ${counts.productTags})`,
  );

  await seedReviews();
  console.log(`✅ Reviews: ${counts.reviews}`);

  await seedAddresses();
  console.log(`✅ Addresses: ${counts.addresses}`);

  await seedOrders(vendorIdToStoreId);
  console.log(
    `✅ Orders: ${counts.orders} (items: ${counts.orderItems}, payments: ${counts.payments}, history: ${counts.orderStatusHistory})`,
  );

  await seedCart();
  console.log(`✅ Cart: ${counts.carts} (items: ${counts.cartItems})`);

  await seedNotifications();
  console.log(`✅ Notifications: ${counts.notifications}`);

  await seedWishlist();
  console.log(`✅ Wishlist: ${counts.wishlists} (items: ${counts.wishlistItems})`);

  console.log("\n🎉 Seed completed successfully.\n");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
