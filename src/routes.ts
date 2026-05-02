// src/routes.ts

const BASE_URL = "https://electromart-backend-three.vercel.app/api/v1/";

export const ROUTES = [
  // ── SYSTEM ─────────────────────────
  `${BASE_URL}/health`,

  // ── AUTH ───────────────────────────
  `${BASE_URL}/auth/signup`,
  `${BASE_URL}/auth/signin`,
  `${BASE_URL}/auth/verify-email`,
  `${BASE_URL}/auth/resend-verification`,
  `${BASE_URL}/auth/refresh-token`,
  `${BASE_URL}/auth/forgot-password`,
  `${BASE_URL}/auth/verify-reset-code`,
  `${BASE_URL}/auth/reset-password`,
  `${BASE_URL}/auth/me`,
  `${BASE_URL}/auth/logout`,
  `${BASE_URL}/auth/change-password`,

  // ── USERS ──────────────────────────
  `${BASE_URL}/users`,
  `${BASE_URL}/users/{id}`,
  `${BASE_URL}/users/{id}/role`,

  // ── ADDRESSES ───────────────────────
  `${BASE_URL}/addresses`,
  `${BASE_URL}/addresses/{id}`,
  `${BASE_URL}/addresses/{id}/default`,

  // ── STORES ──────────────────────────
  `${BASE_URL}/stores`,
  `${BASE_URL}/stores/my/store`,
  `${BASE_URL}/stores/{id}`,

  // ── PRODUCTS ────────────────────────
  `${BASE_URL}/products`,
  `${BASE_URL}/products/recently-viewed`,
  `${BASE_URL}/products/my/products`,
  `${BASE_URL}/products/search`,
  `${BASE_URL}/products/search/suggestions`,
  `${BASE_URL}/products/{id}`,
  `${BASE_URL}/products/{id}/images`,
  `${BASE_URL}/products/{id}/images/{imageId}`,

  // ── TAGS ────────────────────────────
  `${BASE_URL}/tags`,
  `${BASE_URL}/tags/{id}`,
  `${BASE_URL}/tags/{slug}/products`,
  `${BASE_URL}/tags/product/{productId}`,
  `${BASE_URL}/tags/product/{productId}/{tagId}`,

  // ── PRODUCT Q&A ─────────────────────
  `${BASE_URL}/qa/product/{productId}`,
  `${BASE_URL}/qa/{questionId}/answer`,
  `${BASE_URL}/qa/{questionId}`,

  // ── CATEGORIES ──────────────────────
  `${BASE_URL}/categories`,
  `${BASE_URL}/categories/{id}`,

  // ── CART ────────────────────────────
  `${BASE_URL}/cart`,
  `${BASE_URL}/cart/merge`,
  `${BASE_URL}/cart/{productId}`,

  // ── COUPONS ─────────────────────────
  `${BASE_URL}/coupons`,
  `${BASE_URL}/coupons/apply`,
  `${BASE_URL}/coupons/{id}/toggle`,
  `${BASE_URL}/coupons/{id}`,

  // ── ORDERS ──────────────────────────
  `${BASE_URL}/orders`,
  `${BASE_URL}/orders/my`,
  `${BASE_URL}/orders/{id}`,
  `${BASE_URL}/orders/{id}/cancel`,
  `${BASE_URL}/orders/vendor/items`,
  `${BASE_URL}/orders/vendor/items/{itemId}/status`,
  `${BASE_URL}/orders/{orderId}/timeline`,

  // ── PAYMENTS ────────────────────────
  `${BASE_URL}/payments/initiate`,
  `${BASE_URL}/payments/order/{orderId}`,
  `${BASE_URL}/payments/refund/{orderId}`,
  `${BASE_URL}/payments/sslcommerz/success`,
  `${BASE_URL}/payments/sslcommerz/fail`,
  `${BASE_URL}/payments/sslcommerz/cancel`,
  `${BASE_URL}/payments/sslcommerz/ipn`,
  `${BASE_URL}/payments/stripe/webhook`,

  // ── REVIEWS ─────────────────────────
  `${BASE_URL}/reviews/product/{productId}`,
  `${BASE_URL}/reviews/my`,
  `${BASE_URL}/reviews/{reviewId}`,

  // ── RETURNS ─────────────────────────
  `${BASE_URL}/returns/order-item/{orderItemId}`,
  `${BASE_URL}/returns/my`,
  `${BASE_URL}/returns/vendor`,
  `${BASE_URL}/returns/{returnId}/resolve`,

  // ── STOCK ALERTS ────────────────────
  `${BASE_URL}/stock-alerts`,
  `${BASE_URL}/stock-alerts/{productId}/subscribe`,
  `${BASE_URL}/stock-alerts/{productId}/unsubscribe`,

  // ── NOTIFICATIONS ───────────────────
  `${BASE_URL}/notifications`,
  `${BASE_URL}/notifications/unread-count`,
  `${BASE_URL}/notifications/mark-all-read`,
  `${BASE_URL}/notifications/{id}/read`,
  `${BASE_URL}/notifications/push/vapid-key`,
  `${BASE_URL}/notifications/push/subscribe`,

  // ── ADMIN ───────────────────────────
  `${BASE_URL}/admin/dashboard`,
  `${BASE_URL}/admin/revenue/stores`,
  `${BASE_URL}/admin/payments/recent`,
  `${BASE_URL}/admin/vendors`,
  `${BASE_URL}/admin/products/top-selling`,

  // ── VENDOR ──────────────────────────
  `${BASE_URL}/vendor/analytics`,

  // ── LEADERBOARD ─────────────────────
  `${BASE_URL}/leaderboard`,
];