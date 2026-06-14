// src/utils/cacheKeys.ts
export const CacheKeys = {
  // categories
  ALL_CATEGORIES: "categories:all",
  FEATURED_CATEGORIES: "categories:featured",

  // products
  ALL_PRODUCTS: (query: string) => `products:list:${query}`,
  SINGLE_PRODUCT: (id: string) => `products:${id}`,
  SEARCH_PRODUCTS: (query: string) => `products:search:${query}`,
  SEARCH_SUGGESTIONS: (q: string) => `products:suggestions:${q}`,
  PRODUCT_SLUG: (slug: string) => `product:slug:${slug}`,
  FEATURED_PRODUCTS: "featured_products",
  BESTSELLERS: "bestsellers",
  NEW_ARRIVALS: "new_arrivals",

  // brands
  FEATURED_BRANDS: "brands:featured",

  // stores
  ALL_STORES: "stores:all",
  SINGLE_STORE: (id: string) => `stores:${id}`,

  // reviews
  PRODUCT_REVIEWS: (productId: string) => `reviews:product:${productId}`,
 // analytics
  PRODUCT_ANALYTICS: (productId: string) => `analytics:product:${productId}`,
  STORE_ANALYTICS: (storeId: string) => `analytics:store:${storeId}`,


  // admin
  ADMIN_DASHBOARD: "admin:dashboard",
  ADMIN_TOP_PRODUCTS: "admin:top-products",
  REVENUE_BY_STORE: "admin:revenue:stores",

  // vendor analytics
  VENDOR_ANALYTICS: (storeId: string) => `vendor:analytics:${storeId}`,
};