// src/utils/cacheKeys.ts
export const CacheKeys = {
  // categories
  ALL_CATEGORIES: "categories:all",

  // products
  ALL_PRODUCTS: (query: string) => `products:list:${query}`,
  SINGLE_PRODUCT: (id: string) => `products:${id}`,
  SEARCH_PRODUCTS: (query: string) => `products:search:${query}`,
  SEARCH_SUGGESTIONS: (q: string) => `products:suggestions:${q}`,
  PRODUCT_SLUG: (slug: string) => `product:slug:${slug}`,

  // stores
  ALL_STORES: "stores:all",
  SINGLE_STORE: (id: string) => `stores:${id}`,

  // reviews
  PRODUCT_REVIEWS: (productId: string) => `reviews:product:${productId}`,

  // admin
  ADMIN_DASHBOARD: "admin:dashboard",
  ADMIN_TOP_PRODUCTS: "admin:top-products",
  REVENUE_BY_STORE: "admin:revenue:stores",

  // vendor analytics
  VENDOR_ANALYTICS: (storeId: string) => `vendor:analytics:${storeId}`,
};