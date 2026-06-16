# ⚡ Electromart — Backend API

> **Production-grade multi-vendor e-commerce REST API** built with Express, TypeScript, Prisma, PostgreSQL, Redis, and BullMQ. Powering the Electromart marketplace with role-based access, real-time notifications, payment gateway integration, and a full guest checkout flow.

---

## 📋 Table of Contents

- [Tech Stack](#tech-stack)
- [Folder Structure](#folder-structure)
- [Architecture Overview](#architecture-overview)
- [Authentication & Authorization](#authentication--authorization)
- [User Roles](#user-roles)
- [Database Models](#database-models)
- [API Modules](#api-modules)
- [Core Features](#core-features)
- [Background Jobs & Queues](#background-jobs--queues)
- [Security Features](#security-features)
- [Environment Variables](#environment-variables)
- [Installation Guide](#installation-guide)
- [Development Setup](#development-setup)
- [Build & Deployment](#build--deployment)
- [API Documentation](#api-documentation)
- [Error Handling](#error-handling)
- [Validation Strategy](#validation-strategy)
- [File Uploads](#file-uploads)
- [Payment Integration](#payment-integration)
- [Order Management](#order-management)
- [Vendor System](#vendor-system)
- [Return Management](#return-management)
- [Product Q&A](#product-qa)
- [Tags System](#tags-system)
- [Leaderboard](#leaderboard)
- [Wishlist](#wishlist)
- [Cart & Guest Checkout](#cart--guest-checkout)
- [Notifications](#notifications)
- [Caching Strategy](#caching-strategy)
- [Testing](#testing)

---

## Tech Stack

| Category         | Technology                                                   |
| ---------------- | ------------------------------------------------------------ |
| **Runtime**      | Node.js, TypeScript                                          |
| **Framework**    | Express.js 5                                                 |
| **Database**     | PostgreSQL (via Prisma 7 ORM)                                |
| **Cache/Queue**  | Redis (BullMQ + manual caching)                              |
| **Auth**         | JWT (access + refresh tokens), Passport.js, httpOnly cookies |
| **Validation**   | Zod                                                          |
| **File Storage** | Cloudinary (image/video uploads)                             |
| **Payments**     | SSLCommerz, Stripe                                           |
| **Email**        | Brevo (Sendinblue)                                           |
| **Realtime**     | Socket.io                                                    |
| **Push**         | Web Push API (VAPID)                                         |
| **Monitoring**   | Sentry, Winston (logging), Daily Rotate File                 |
| **Docs**         | Swagger (swagger-jsdoc + swagger-ui-express)                 |
| **Testing**      | Jest, Supertest                                              |
| **Process Mgmt** | PM2                                                          |
| **Container**    | Docker + docker-compose                                      |

---

## Folder Structure

```
src/
├── app.ts                              # Express app setup, middleware chain
├── server.ts                           # Entry point, bootstrap, socket init, cron jobs
├── app/
│   ├── bootstrap/
│   │   └── createSuperAdmin.ts         # Auto-seeds admin/customer/super-admin on startup
│   ├── config/
│   │   ├── index.ts                    # Environment config parser
│   │   ├── cloudinary.ts               # Cloudinary SDK setup
│   │   ├── multer.ts                   # Multer memory storage config
│   │   ├── passport.ts                 # JWT cookie strategy
│   │   ├── redis.ts                    # Redis / BullMQ connection
│   │   ├── sentry.ts                   # Sentry initialization
│   │   ├── swagger.ts                  # OpenAPI 3.0 spec + paths
│   │   └── webPush.ts                  # VAPID push notification config
│   ├── middlewares/
│   │   ├── authenticate.ts             # JWT auth with auto-refresh via cookie
│   │   ├── authorize.ts                # Role-based access control
│   │   ├── guest.ts                    # Guest ID cookie management
│   │   ├── globalErrorHandler.ts       # Unified error handler
│   │   ├── notFound.ts                 # 404 handler
│   │   ├── rateLimiter.ts              # Global / auth / search / guest rate limits
│   │   ├── requestLogger.ts            # HTTP request logging
│   │   ├── slowQueryLogger.ts          # Slow DB query detection
│   │   ├── upload.ts                   # Multer upload middleware
│   │   ├── parser.ts                   # Multipart form-data parser
│   │   ├── requestId.ts               # UUID request tagging
│   │   └── validate.ts                 # Zod schema validation middleware
│   ├── modules/
│   │   ├── auth/                       # Signup, signin, logout, refresh, email verify, password reset
│   │   ├── admin/                      # Dashboard overview, revenue, payments, vendors, top products
│   │   ├── users/                      # User CRUD, ban, avatar, notification prefs
│   │   ├── address/                    # Address CRUD, set default
│   │   ├── store/                      # Store CRUD, policies, settings, approve/pause/close
│   │   ├── product/                    # Product CRUD, images, search, suggestions, filters
│   │   ├── category/                   # Category CRUD, featured, slug lookup
│   │   ├── brand/                      # Brand CRUD, featured
│   │   ├── tag/                        # Tag CRUD, attach/detach to products
│   │   ├── cart/                       # Cart CRUD, merge, coupon (guest + auth)
│   │   ├── wishlist/                   # Wishlist CRUD, check (guest + auth)
│   │   ├── order/                      # Place order, guest order, vendor orders, cancel, status
│   │   ├── order-tracking/             # Timeline (auth + guest by email)
│   │   ├── payment/                    # Initiate, SSLCommerz/Stripe, refund
│   │   ├── coupon/                     # Coupon CRUD, toggle, apply, promotions
│   │   ├── review/                     # Review CRUD, product reviews, latest
│   │   ├── return/                     # Return request, vendor resolve
│   │   ├── product-qa/                 # Ask, answer, moderate Q&A
│   │   ├── notification/               # Send, list, mark read, push subscribe
│   │   ├── stock-alert/                # Subscribe/unsubscribe back-in-stock alerts
│   │   ├── banner/                     # Banner CRUD (bento grid types)
│   │   ├── leaderboard/                # Vendor leaderboard (admin)
│   │   ├── vendor-analytics/           # Vendor dashboard metrics
│   │   └── payout/                     # Vendor payout requests & history
│   ├── routers/
│   │   └── index.ts                    # Central route registry
│   └── types/
├── jobs/
│   ├── leaderboard.job.ts              # Weekly vendor leaderboard computation
│   ├── weeklyDigest.job.ts             # Weekly email digest for customers
│   ├── guestCleanup.job.ts             # Hourly stale guest data cleanup
│   ├── queues/                         # BullMQ queue definitions
│   │   ├── email.queue.ts
│   │   ├── notification.queue.ts
│   │   ├── payment.queue.ts
│   │   └── upload.queue.ts
│   └── workers/                        # BullMQ workers
│       ├── email.worker.ts
│       ├── notification.worker.ts
│       ├── payment.worker.ts
│       └── upload.worker.ts
├── lib/
│   └── prisma.ts                       # PrismaClient singleton with Pg adapter
├── socket/
│   └── socket.ts                       # Socket.io setup + user mapping
├── templates/
│   └── emails/                         # HTML email templates
│       ├── verifyEmailTemplate.ts
│       ├── resetPasswordTemplate.ts
│       └── orderPlacedTemplate.ts
├── utils/
│   ├── apiErrors.ts                    # Custom ApiError class
│   ├── sendResponse.ts                # Unified JSON response helper
│   ├── catchAsync.ts                  # Async error wrapper
│   ├── logger.ts                      # Winston logger (console + daily rotate)
│   ├── paginationHelper.ts            # Pagination calculator
│   ├── cache.ts                       # Redis cache helpers (getOrSetCache, invalidate)
│   ├── cacheKeys.ts                   # Cache key constants
│   ├── emailTemplates.ts             # Order confirmation templates
│   ├── cookieHelpers.ts              # Auth cookie set/clear
│   ├── uploadToCloudinary.ts         # Cloudinary stream upload
│   ├── sendEmail.ts                  # Brevo transactional email
│   ├── sendPushNotification.ts       # Web push sender
│   ├── recentlyViewed.ts             # Redis-backed recently viewed products
│   ├── generateUniqueSlug.ts         # Nanoid-based unique slug generator
│   └── envValidator.ts               # Required env validation
└── tests/
    ├── setup.ts
    ├── auth.test.ts
    └── product.test.ts
```

---

## Architecture Overview

```
Client (Next.js)
    │
    ├── httpOnly cookies ──► JWT Auth (Passport.js)
    │
    ▼
Express 5 API (http + Socket.io)
    │
    ├── Middleware Pipeline:
    │   Helmet → CORS → HPP → CookieParser → RateLimiter → Passport → Router
    │
    ├── Controllers (thin) → Services (business logic)
    │   │
    │   ├── Prisma ORM ──► PostgreSQL
    │   ├── Redis ──► Caching + BullMQ Queues
    │   ├── Cloudinary ──► File uploads
    │   ├── Brevo ──► Email
    │   ├── SSLCommerz / Stripe ──► Payments
    │   └── Web Push ──► Push notifications
    │
    ├── BullMQ Workers (background):
    │   Email | Upload | Notification | Payment
    │
    ├── node-cron Jobs:
    │   Leaderboard | Weekly Digest | Guest Cleanup
    │
    └── Socket.io ──► Real-time notifications to connected users
```

---

## Authentication & Authorization

### Authentication Flow

1. **Sign in** — credentials verified, JWT access (15m) + refresh (7d) tokens issued as **httpOnly cookies**
2. **Authenticated requests** — Passport JWT strategy reads `accessToken` cookie
3. **Auto-refresh** — If access token expired, middleware attempts refresh via `refreshToken` cookie
4. **Logout** — Cookies cleared server-side

### Authorization

Role-based access control via the `authorize()` middleware:

```typescript
router.post('/products', authenticate, authorize('VENDOR'), handler);
```

- `SUPER_ADMIN` bypasses all role checks automatically
- Multiple roles can be combined: `authorize('VENDOR', 'ADMIN')`

---

## User Roles

| Role            | Capabilities                                                               |
| --------------- | -------------------------------------------------------------------------- |
| **SUPER_ADMIN** | Full system access, bypasses all authorization checks                      |
| **ADMIN**       | Manage users, vendors, products, orders, categories, coupons, banners, Q&A |
| **VENDOR**      | Own store, products, orders, returns, Q&A, payouts, analytics              |
| **CUSTOMER**    | Place orders, manage cart/wishlist, reviews, returns, addresses            |

---

## Database Models

### Core Entities

| Model                  | Description                                       |
| ---------------------- | ------------------------------------------------- |
| `User`                 | Users with role, email verification, ban status   |
| `Address`              | Shipping addresses linked to user                 |
| `Store`                | Vendor store with settings, policies, ratings     |
| `Category`             | Product categories (featured)                     |
| `Brand`                | Product brands (featured)                         |
| `Product`              | Full product with pricing, stock, specs, images   |
| `ProductImage`         | Images with primary flag, ordering, Cloudinary ID |
| `ProductVariant`       | Variants (e.g. size/color) with price override    |
| `ProductSpecification` | Key-value spec pairs (RAM, Storage, etc.)         |
| `Tag`                  | Product tags (many-to-many via `ProductTag`)      |

### Commerce Entities

| Model                | Description                                      |
| -------------------- | ------------------------------------------------ |
| `Cart`               | Shopping cart (supports guest via `guestId`)     |
| `CartItem`           | Cart line items with variant support             |
| `Wishlist`           | Wishlist (supports guest via `guestId`)          |
| `WishlistItem`       | Wishlist products (unique per wishlist)          |
| `Order`              | Order with guest support, coupon, status history |
| `OrderItem`          | Line items per vendor store                      |
| `OrderAddress`       | Shipping address snapshot at order time          |
| `OrderStatusHistory` | Chronological status change log                  |
| `Coupon`             | Discount codes (percentage/fixed, usage limits)  |
| `Payment`            | Payment records (SSLCommerz/Stripe)              |

### Engagement Entities

| Model              | Description                                      |
| ------------------ | ------------------------------------------------ |
| `Review`           | Product ratings & comments (unique per customer) |
| `ProductQuestion`  | Customer Q&A with vendor answers & moderation    |
| `ReturnRequest`    | Return/refund requests with vendor resolution    |
| `Notification`     | In-app notifications per user                    |
| `PushSubscription` | Web push subscription storage                    |
| `StockAlert`       | Back-in-stock notification requests              |

### Vendor Operations

| Model    | Description                              |
| -------- | ---------------------------------------- |
| `Payout` | Vendor payout requests & transaction log |
| `Banner` | Multi-type banner system (bento grid)    |

---

## API Modules

All routes are prefixed with `/api/v1`.

### Auth — `/api/v1/auth`

| Method | Endpoint               | Access        | Description                   |
| ------ | ---------------------- | ------------- | ----------------------------- |
| POST   | `/signup`              | Public        | Register (CUSTOMER or VENDOR) |
| POST   | `/signin`              | Public        | Sign in, set auth cookies     |
| GET    | `/verify-email`        | Public        | Verify email token            |
| POST   | `/resend-verification` | Public        | Resend verification email     |
| POST   | `/refresh-token`       | Public        | Refresh access token          |
| POST   | `/forgot-password`     | Public        | Request password reset code   |
| POST   | `/verify-reset-code`   | Public        | Verify reset code             |
| POST   | `/reset-password`      | Public        | Set new password              |
| GET    | `/me`                  | Authenticated | Get current user profile      |
| POST   | `/logout`              | Authenticated | Clear auth cookies            |
| POST   | `/change-password`     | Authenticated | Change password (old+new)     |

### Users — `/api/v1/users`

| Method | Endpoint                 | Access         | Description                |
| ------ | ------------------------ | -------------- | -------------------------- |
| POST   | `/`                      | Public         | Create user                |
| GET    | `/`                      | ADMIN          | List all users (paginated) |
| GET    | `/:id`                   | ADMIN          | Get user by ID             |
| PATCH  | `/:id`                   | Authenticated  | Update user                |
| PATCH  | `/:id/ban`               | ADMIN          | Ban/unban user             |
| DELETE | `/:id`                   | ADMIN/CUSTOMER | Delete user                |
| GET    | `/me/notification-prefs` | Authenticated  | Get notification prefs     |
| PATCH  | `/me/notification-prefs` | Authenticated  | Update notification prefs  |
| PATCH  | `/me/avatar`             | Authenticated  | Upload avatar              |

### Stores — `/api/v1/stores`

| Method | Endpoint        | Access | Description                     |
| ------ | --------------- | ------ | ------------------------------- |
| GET    | `/`             | Public | List stores                     |
| GET    | `/top-vendors`  | Public | Top vendors                     |
| GET    | `/:id`          | Public | Get store by ID                 |
| POST   | `/`             | VENDOR | Create store                    |
| GET    | `/my/store`     | VENDOR | Get own store                   |
| PATCH  | `/:id`          | VENDOR | Update store (logo upload)      |
| PATCH  | `/:id/policies` | VENDOR | Update return/shipping policies |
| PATCH  | `/:id/settings` | VENDOR | Update vendor settings          |
| PATCH  | `/:id/pause`    | VENDOR | Pause store                     |
| PATCH  | `/:id/approve`  | ADMIN  | Approve store                   |
| DELETE | `/:id`          | VENDOR | Close store                     |
| DELETE | `/:id/products` | VENDOR | Delete all store products       |

### Products — `/api/v1/products`

| Method | Endpoint               | Access        | Description                  |
| ------ | ---------------------- | ------------- | ---------------------------- |
| GET    | `/`                    | Public        | List products (filtered)     |
| GET    | `/featured`            | Public        | Featured products            |
| GET    | `/bestsellers`         | Public        | Best-selling products        |
| GET    | `/new-arrivals`        | Public        | New arrivals                 |
| GET    | `/recommendations/:id` | Public        | Product recommendations      |
| GET    | `/search`              | Public        | Full-text search             |
| GET    | `/search/suggestions`  | Public        | Search suggestions           |
| GET    | `/recently-viewed`     | Authenticated | Recently viewed products     |
| GET    | `/:slug`               | Public        | Product by slug              |
| POST   | `/`                    | VENDOR        | Create product (with images) |
| GET    | `/my/products`         | VENDOR        | Own products                 |
| PATCH  | `/:id`                 | VENDOR        | Update product               |
| DELETE | `/:id`                 | VENDOR/ADMIN  | Delete product               |
| POST   | `/:id/images`          | VENDOR        | Upload product images        |
| GET    | `/:id/images`          | VENDOR        | Get product images           |
| PATCH  | `/:id/images/primary`  | VENDOR        | Set primary image            |
| PATCH  | `/:id/images/reorder`  | VENDOR        | Reorder images               |
| DELETE | `/:id/images/:imageId` | VENDOR        | Delete product image         |

### Cart — `/api/v1/cart`

| Method | Endpoint       | Access   | Description          |
| ------ | -------------- | -------- | -------------------- |
| GET    | `/`            | CUSTOMER | View cart            |
| POST   | `/`            | CUSTOMER | Add to cart          |
| POST   | `/:productId`  | CUSTOMER | Add by product ID    |
| PATCH  | `/:productId`  | CUSTOMER | Update item quantity |
| DELETE | `/:productId`  | CUSTOMER | Remove item          |
| DELETE | `/`            | CUSTOMER | Clear cart           |
| POST   | `/merge`       | CUSTOMER | Merge guest cart     |
| POST   | `/coupon`      | CUSTOMER | Apply coupon         |
| DELETE | `/coupon`      | CUSTOMER | Remove coupon        |
| GET    | `/guest`       | Guest    | View guest cart      |
| POST   | `/guest`       | Guest    | Add to guest cart    |
| POST   | `/guest/merge` | Guest    | Merge carts          |

### Wishlist — `/api/v1/wishlist`

| Method | Endpoint            | Access   | Description           |
| ------ | ------------------- | -------- | --------------------- |
| GET    | `/`                 | CUSTOMER | Get wishlist          |
| POST   | `/:productId`       | CUSTOMER | Add to wishlist       |
| DELETE | `/:productId`       | CUSTOMER | Remove from wishlist  |
| DELETE | `/`                 | CUSTOMER | Clear wishlist        |
| GET    | `/check/:productId` | CUSTOMER | Check if in wishlist  |
| GET    | `/guest`            | Guest    | Guest wishlist        |
| POST   | `/guest/:productId` | Guest    | Add to guest wishlist |
| DELETE | `/guest/:productId` | Guest    | Remove from guest     |

### Orders — `/api/v1/orders`

| Method | Endpoint                       | Access       | Description            |
| ------ | ------------------------------ | ------------ | ---------------------- |
| POST   | `/`                            | CUSTOMER     | Place order            |
| POST   | `/guest`                       | Guest        | Place guest order      |
| GET    | `/guest/track/:orderId`        | Guest        | Track guest order      |
| GET    | `/my`                          | CUSTOMER     | My orders (paginated)  |
| GET    | `/:id`                         | Auth/Guest   | Get order details      |
| PATCH  | `/:id/cancel`                  | CUSTOMER     | Cancel order           |
| GET    | `/vendor/items`                | VENDOR       | Vendor order items     |
| PATCH  | `/vendor/items/:itemId/status` | VENDOR/ADMIN | Update item status     |
| GET    | `/`                            | ADMIN        | All orders (paginated) |
| PATCH  | `/:id`                         | ADMIN        | Update order status    |
| PATCH  | `/:id/admin-cancel`            | ADMIN        | Admin cancel order     |

### Order Tracking — `/api/v1/orderTracking`

| Method | Endpoint                   | Access | Description           |
| ------ | -------------------------- | ------ | --------------------- |
| GET    | `/:orderId/timeline`       | Auth   | Order status timeline |
| GET    | `/:orderId/guest-timeline` | Guest  | Guest order timeline  |

### Payments — `/api/v1/payments`

| Method | Endpoint              | Access     | Description            |
| ------ | --------------------- | ---------- | ---------------------- |
| POST   | `/initiate`           | CUSTOMER   | Initiate payment       |
| POST   | `/initiate/guest`     | Guest      | Initiate guest payment |
| GET    | `/order/:orderId`     | Auth/Guest | Payment status         |
| POST   | `/refund/:orderId`    | ADMIN      | Refund payment         |
| POST   | `/sslcommerz/success` | Public     | SSLCommerz success     |
| POST   | `/sslcommerz/fail`    | Public     | SSLCommerz fail        |
| POST   | `/sslcommerz/cancel`  | Public     | SSLCommerz cancel      |
| POST   | `/sslcommerz/ipn`     | Public     | SSLCommerz IPN         |
| POST   | `/stripe/webhook`     | Public     | Stripe webhook         |

### Coupons — `/api/v1/coupons`

| Method | Endpoint      | Access   | Description         |
| ------ | ------------- | -------- | ------------------- |
| GET    | `/promotions` | Public   | Promotional coupons |
| GET    | `/`           | ADMIN    | List all coupons    |
| POST   | `/`           | ADMIN    | Create coupon       |
| PATCH  | `/:id`        | ADMIN    | Update coupon       |
| PATCH  | `/:id/toggle` | ADMIN    | Activate/deactivate |
| DELETE | `/:id`        | ADMIN    | Delete coupon       |
| POST   | `/apply`      | CUSTOMER | Preview discount    |

### Reviews — `/api/v1/reviews`

| Method | Endpoint              | Access         | Description     |
| ------ | --------------------- | -------------- | --------------- |
| GET    | `/latest`             | Public         | Latest reviews  |
| GET    | `/product/:productId` | Public         | Product reviews |
| POST   | `/product/:productId` | CUSTOMER       | Create review   |
| GET    | `/my`                 | CUSTOMER       | My reviews      |
| PATCH  | `/:reviewId`          | CUSTOMER       | Update review   |
| DELETE | `/:reviewId`          | CUSTOMER/ADMIN | Delete review   |

### Returns — `/api/v1/returns`

| Method | Endpoint                   | Access   | Description            |
| ------ | -------------------------- | -------- | ---------------------- |
| POST   | `/order-item/:orderItemId` | CUSTOMER | Create return request  |
| GET    | `/my`                      | CUSTOMER | My return requests     |
| GET    | `/vendor`                  | VENDOR   | Vendor return requests |
| PATCH  | `/:returnId/resolve`       | VENDOR   | Approve/reject return  |

### Product Q&A — `/api/v1/qa`

| Method | Endpoint                | Access                | Description           |
| ------ | ----------------------- | --------------------- | --------------------- |
| GET    | `/product/:productId`   | Public                | Get product Q&A       |
| POST   | `/product/:productId`   | CUSTOMER              | Ask question          |
| PATCH  | `/:questionId/answer`   | VENDOR                | Answer question       |
| PATCH  | `/:questionId/moderate` | VENDOR/ADMIN          | Moderate question     |
| GET    | `/vendor/questions`     | VENDOR                | Vendor questions      |
| GET    | `/admin/questions`      | ADMIN                 | All questions (admin) |
| DELETE | `/:questionId`          | CUSTOMER/VENDOR/ADMIN | Delete question       |

### Tags — `/api/v1/tags`

| Method | Endpoint                     | Access | Description             |
| ------ | ---------------------------- | ------ | ----------------------- |
| GET    | `/`                          | Public | List all tags           |
| GET    | `/:slug/products`            | Public | Products by tag         |
| POST   | `/`                          | ADMIN  | Create tag              |
| DELETE | `/:id`                       | ADMIN  | Delete tag              |
| POST   | `/product/:productId`        | VENDOR | Add tags to product     |
| DELETE | `/product/:productId/:tagId` | VENDOR | Remove tag from product |

### Notifications — `/api/v1/notifications`

| Method | Endpoint                 | Access        | Description                |
| ------ | ------------------------ | ------------- | -------------------------- |
| POST   | `/`                      | Admin         | Send notification          |
| GET    | `/me`                    | Authenticated | My notifications           |
| GET    | `/unread-count`          | Authenticated | Unread count               |
| PATCH  | `/:id/read`              | Authenticated | Mark as read               |
| PATCH  | `/mark-all-read`         | Authenticated | Mark all read              |
| PATCH  | `/me/email-notification` | Authenticated | Toggle email notifications |
| POST   | `/push/subscribe`        | Authenticated | Subscribe to push          |
| GET    | `/push/vapid-key`        | Public        | Get VAPID public key       |

### Stock Alerts — `/api/v1/stock-alerts`

| Method | Endpoint                  | Access   | Description                |
| ------ | ------------------------- | -------- | -------------------------- |
| GET    | `/`                       | CUSTOMER | My stock alerts            |
| POST   | `/:productId/subscribe`   | CUSTOMER | Subscribe to back-in-stock |
| DELETE | `/:productId/unsubscribe` | CUSTOMER | Unsubscribe                |

### Banners — `/api/v1/banners`

| Method | Endpoint | Access | Description            |
| ------ | -------- | ------ | ---------------------- |
| GET    | `/`      | Public | Active banners by type |

### Admin Banners — `/api/v1/admin/banners`

| Method | Endpoint | Access | Description           |
| ------ | -------- | ------ | --------------------- |
| GET    | `/`      | ADMIN  | List all banners      |
| GET    | `/:id`   | ADMIN  | Get banner by ID      |
| POST   | `/`      | ADMIN  | Create banner (image) |
| PATCH  | `/:id`   | ADMIN  | Update banner         |
| DELETE | `/:id`   | ADMIN  | Delete banner         |

### Admin — `/api/v1/admin`

| Method | Endpoint            | Access | Description              |
| ------ | ------------------- | ------ | ------------------------ |
| GET    | `/overview`         | ADMIN  | Dashboard overview stats |
| GET    | `/revenue-by-store` | ADMIN  | Revenue breakdown        |
| GET    | `/recent-payments`  | ADMIN  | Recent payments          |
| GET    | `/vendors`          | ADMIN  | Vendor list              |
| GET    | `/top-products`     | ADMIN  | Top selling products     |

### Vendor Analytics — `/api/v1/vendor-analytics`

| Method | Endpoint | Access | Description         |
| ------ | -------- | ------ | ------------------- |
| GET    | `/`      | VENDOR | Dashboard analytics |

### Payouts — `/api/v1/payouts`

| Method | Endpoint        | Access | Description     |
| ------ | --------------- | ------ | --------------- |
| GET    | `/my`           | VENDOR | Payout history  |
| GET    | `/transactions` | VENDOR | Transaction log |
| POST   | `/request`      | VENDOR | Request payout  |

### Leaderboard — `/api/v1/leaderboard`

| Method | Endpoint | Access | Description        |
| ------ | -------- | ------ | ------------------ |
| GET    | `/`      | ADMIN  | Vendor leaderboard |

---

## Core Features

### 🛒 Guest Checkout

- Full guest cart and wishlist support via `guestId` cookie
- Guest order placement with email tracking
- Guest cart merges into authenticated cart on sign in
- Automatic cleanup of stale guest data (48h threshold)

### 🖼️ Product Image Management

- Multiple image uploads (up to 5 per batch)
- Set primary image, reorder, delete individual images
- Cloudinary integration for cloud storage
- Background image processing via BullMQ workers

### 🔍 Product Search & Discovery

- Full-text search with rate limiting
- Search suggestions (autocomplete)
- Featured products, bestsellers, new arrivals
- Product recommendations
- Recently viewed products (Redis-backed, max 10)
- Category, brand, price range filtering
- Tag-based browsing

### 🏪 Vendor Store System

- Store creation with logo, cover image, bio
- Store settings: auto-accept orders, auto-update stock, currency, payout cycle
- Store policies: return policy, shipping policy
- Admin approval workflow
- Store pause/close functionality
- Vendor notification preferences

### 🎟️ Coupon System

- Percentage and fixed discount types
- Usage limits and min-order amounts
- Max discount caps
- Date-range validity
- Toggle active/inactive
- Promotional coupons for public display

---

## Background Jobs & Queues

### Cron Jobs (node-cron)

| Job               | Schedule             | Description                                  |
| ----------------- | -------------------- | -------------------------------------------- |
| **Leaderboard**   | Every Friday 2:00 AM | Computes and caches vendor leaderboard data  |
| **Weekly Digest** | Every Monday 9:00 AM | Sends weekly digest emails to customers      |
| **Guest Cleanup** | Every hour           | Deletes guest carts/wishlists older than 48h |

### BullMQ Workers

Queue-based background processing with Redis:

| Worker                  | Queue          | Concurrency | Description                  |
| ----------------------- | -------------- | ----------- | ---------------------------- |
| **Upload Worker**       | `upload`       | 3           | Processes Cloudinary uploads |
| **Email Worker**        | `email`        | 5           | Sends transactional emails   |
| **Notification Worker** | `notification` | 5           | Processes push notifications |
| **Payment Worker**      | `payment`      | 3           | Payment confirmation tasks   |

---

## Security Features

- **Helmet** — HTTP security headers (CSP, XSS, etc.)
- **HPP** — HTTP parameter pollution protection
- **CORS** — Whitelisted origins (client + frontend URLs)
- **Rate Limiting** — Global (100/15min), Auth (10/15min), Search, Guest tracker
- **JWT httpOnly Cookies** — Prevents XSS token theft
- **Auto-refresh** — Seamless token rotation without exposing tokens to JS
- **Input Validation** — Zod schemas on all inputs
- **SQL Injection Protection** — Prisma ORM parameterized queries
- **File Upload Validation** — MIME type + size restrictions (50MB)
- **Sentry Error Tracking** — Production error monitoring
- **Request ID** — UUID tagging for request tracing
- **Slow Query Logging** — Detects and logs slow database queries
- **Account Ban** — Suspended users blocked at Passport level
- **Whitelisted IPs/Roles** — Rate limit bypass for trusted actors

---

## Environment Variables

```env
# ── Server ───────────────────────────────────────────
NODE_ENV=development
PORT=5000
APP_NAME=Electromart

# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:pass@localhost:5432/Electromart

# ── Redis ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── JWT ───────────────────────────────────────────────
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ── CORS ──────────────────────────────────────────────
FRONTEND_URL=http://localhost:3000
CLIENT_URL=http://localhost:3000
BACKEND_URL=http://localhost:5000
LOCAL_FRONTEND_URL=http://localhost:3000

# ── Cloudinary ────────────────────────────────────────
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# ── Email (Brevo) ─────────────────────────────────────
BREVO_API_KEY=your-brevo-key
BREVO_SENDER_EMAIL=sender@example.com

# ── Payments ──────────────────────────────────────────
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASSWORD=your-store-password
SSLCOMMERZ_SUCCESS_URL=http://localhost:3000/payment/success
SSLCOMMERZ_FAIL_URL=http://localhost:3000/payment/fail
SSLCOMMERZ_CANCEL_URL=http://localhost:3000/payment/cancel
SSLCOMMERZ_IPN_URL=https://your-ipn-url.com/ipn
SSLCOMMERZ_IS_LIVE=false

STRIPE_SECRET_KEY=sk_test_...
STRIPE_SUCCESS_URL=http://localhost:3000/payment/success
STRIPE_CANCEL_URL=http://localhost:3000/payment/cancel

# ── Web Push (VAPID) ──────────────────────────────────
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_EMAIL=mailto:admin@example.com

# ── Sentry ────────────────────────────────────────────
SENTRY_DSN=https://your-dsn@sentry.io/your-project

# ── Bootstrap Users ───────────────────────────────────
ADMIN_EMAIL=admin@Electromart.com
ADMIN_PASSWORD=SecurePass@123
SUPER_ADMIN_EMAIL=super@Electromart.com
SUPER_ADMIN_PASSWORD=SuperSecure@123
CUSTOMER_EMAIL=customer@Electromart.com
CUSTOMER_PASSWORD=Demo@1234

# ── Rate Limiting ─────────────────────────────────────
RATE_LIMIT_WHITELIST_IPS=127.0.0.1,::1

# ── Seed ──────────────────────────────────────────────
SEED_DEMO_PASSWORD=Demo@1234
```

---

## Installation Guide

### Prerequisites

- **Node.js** >= 18.x
- **PostgreSQL** >= 14.x
- **Redis** >= 6.x
- **npm** or **pnpm**

### Clone & Install

```bash
git clone <repository-url>
cd Electromart-backend

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate
```

### Database Setup

```bash
# Create the database
createdb Electromart

# Run migrations
npx prisma migrate dev --name init

# Seed the database
npx prisma db seed

# (Optional) Seed banners
npx tsx prisma/banner-seed.ts
```

### Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

---

## Development Setup

```bash
# Start development server with hot reload
npm run dev

# In another terminal, start Redis (if not running)
redis-server
```

The server starts on `http://localhost:5000` with:

- **API**: `http://localhost:5000/api/v1`
- **Swagger Docs**: `http://localhost:5000/api-docs`
- **Health Check**: `http://localhost:5000/health`

### Docker Setup

```bash
# Build and start all services
docker-compose up --build

# Run migrations inside container
docker exec -it Electromart_app npx prisma migrate dev --name init

# Stop
docker-compose down
```

### Available Scripts

| Script              | Description                      |
| ------------------- | -------------------------------- |
| `npm run dev`       | Start dev server with hot reload |
| `npm run build`     | Compile TypeScript to `dist/`    |
| `npm start`         | Run compiled production build    |
| `npm test`          | Run tests (Jest)                 |
| `npm run test:cov`  | Run tests with coverage          |
| `npm run lint`      | Lint source files                |
| `npm run lint:fix`  | Auto-fix lint issues             |
| `npm run format`    | Format with Prettier             |
| `npm run typecheck` | TypeScript type checking         |
| `npm run seed`      | Seed database with mock data     |
| `npm run pm2`       | Start with PM2 process manager   |

---

## Build & Deployment

### Production Build

```bash
npm run build
npm start
```

### PM2 (Process Manager)

```bash
npm run pm2           # Start with PM2
npm run pm2:reload    # Reload PM2 process
```

### Docker

```bash
docker-compose up -d  # Start in detached mode
```

### Deployment Checklist

1. Set `NODE_ENV=production`
2. Configure PostgreSQL connection string
3. Set up Redis instance
4. Configure Cloudinary credentials
5. Set up Brevo/Sendinblue for emails
6. Configure SSLCommerz/Stripe keys
7. Set VAPID keys for push notifications
8. Configure Sentry DSN (optional)
9. Whitelist production API URLs in CORS
10. Run database migrations
11. Build and start with PM2 or Docker

---

## API Documentation

Interactive Swagger documentation is available at `/api-docs` when the server is running:

- **Development**: `http://localhost:5000/api-docs`
- **Production**: `https://your-domain.com/api-docs`

The Swagger spec includes:

- All endpoints with request/response schemas
- Authentication (Bearer JWT, authorized via "Authorize" button)
- Pagination metadata (`page`, `limit`, `total`, `totalPages`)
- Standardized response formats (`SuccessResponse`, `ErrorResponse`, `PaginatedResponse`)

---

## Error Handling

### Standard Error Response

```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

### Handled Error Types

| Error Type              | Status | Description                                  |
| ----------------------- | ------ | -------------------------------------------- |
| `ApiError` (custom)     | varies | Application-level errors                     |
| `ZodError`              | 400    | Input validation failures                    |
| Prisma `P2002` (unique) | 409    | Duplicate field violation                    |
| Prisma `P2025`          | 404    | Record not found                             |
| Prisma `P2003`          | 400    | Related record missing                       |
| `TokenExpiredError`     | 401    | JWT expired                                  |
| `JsonWebTokenError`     | 401    | Invalid JWT                                  |
| `MulterError`           | 400    | File upload errors                           |
| Unhandled errors        | 500    | Internal server error (hidden in production) |

---

## Validation Strategy

- **Zod** schemas for all request validation (body, params, query)
- Centralized `validate` middleware extracts schema errors
- File upload validation via Multer (MIME types + size limits)
- Database constraints enforced at Prisma level
- Rate limiting as a soft validation layer

---

## File Uploads

- **Storage**: Cloudinary (cloud-based image/video hosting)
- **Middleware**: Multer (memory storage, 50MB limit)
- **Allowed types**: JPEG, PNG, WebP, PDF, MP4, QuickTime
- **Processing**: Async BullMQ worker for image uploads (3 concurrent)
- **Features**:
  - Multiple uploads (up to 5 images per batch)
  - Primary image selection
  - Image reordering
  - Delete with Cloudinary cleanup
  - Avatar upload for users
  - Store logo upload
  - Banner image upload

---

## Payment Integration

### SSLCommerz (Bangladesh)

- **Environment**: Sandbox/Live via `SSLCOMMERZ_IS_LIVE`
- **Flow**: Initiate → Redirect → Success/Fail/Cancel → IPN validation
- **Refund**: Full refund via SSLCommerz API

### Stripe (International)

- **Flow**: Create checkout session → Redirect → Webhook confirmation
- **Webhook**: Raw body parsing for signature verification
- **Metadata**: Order ID embedded in checkout session

### Payment Flow

1. Customer places order (status: `PENDING`)
2. Payment initiated with chosen gateway
3. Customer redirected to gateway page
4. Gateway posts back (success/ipn) → order confirmed
5. Payments can be refunded by admin

---

## Order Management

### Order Lifecycle

```
PENDING → PROCESSING → SHIPPED → DELIVERED
                ↓
            CANCELLED
```

### Guest Orders

- Placed without authentication
- Trackable via order ID + email
- Full order timeline available

### Vendor Orders

- Vendors see only line items for their store
- Update individual item status
- Support multi-vendor orders

### Admin Orders

- View all orders with search/filter
- Override order status
- Admin cancellation with reason

### Order Timeline

- Chronological status change history
- Available for both authenticated and guest users

---

## Vendor System

### Store Management

- Vendors create and manage their store profile
- Store approval workflow (admin must approve)
- Store pause/close capabilities
- Custom return and shipping policies
- Configurable vendor settings (auto-accept orders, currency, payout cycle)

### Vendor Dashboard

- Sales analytics and revenue charts
- Order management filtered by store
- Product and inventory management
- Return request handling
- Product Q&A management
- Payout requests and transaction history

### Payout System

- Vendors request payouts (configurable min amount)
- Payout history and transaction log
- Monthly payout cycle (configurable)

---

## Return Management

### Flow

```
CUSTOMER: Create return request (with reason)
    ↓
VENDOR: View return requests
    ↓
VENDOR: Approve or Reject (with note)
    ↓
Status updated: APPROVED / REJECTED / RETURNED / REFUNDED / COMPLETED
```

- Each return request is linked to a specific `OrderItem`
- Customers can view their return request status

---

## Product Q&A

### Flow

```
CUSTOMER: Ask question on product page
    ↓
VENDOR: View questions for their products
    ↓
VENDOR: Answer question
    ↓
ADMIN/VENDOR: Moderate (approve/reject) if needed
```

- Questions start as `PENDING` status
- Moderation by vendor or admin
- Customers can delete their own questions

---

## Tags System

- Tags are reusable labels attached to products (many-to-many)
- Browsing products by tag slug
- Admin creates/deletes tags
- Vendors attach/detach tags to their products

---

## Leaderboard

- Weekly vendor leaderboard computed every Friday
- Admin-only view
- Cached in Redis for performance
- Based on vendor performance metrics

---

## Wishlist

- Supports both authenticated users and guests
- Check if product is in wishlist
- Add/remove individual items
- Clear entire wishlist
- Guest wishlist merges on authentication

---

## Cart & Guest Checkout

### Guest Cart

- `guestId` cookie (48h TTL) auto-generated for non-authenticated users
- Full cart operations: add, update, remove, clear, apply coupon
- Guest cart merge on sign in

### Authenticated Cart

- Persistent cart linked to user account
- All guest operations available
- Coupon support

### Checkout Flow

```
Cart → Shipping Address → Place Order → Payment Initiation → Gateway Redirect
```

---

## Notifications

### In-App Notifications

- Stored in database per user
- Read/unread tracking
- Mark individual or all as read
- Unread count endpoint

### Real-Time (Socket.io)

- Connected users receive notifications instantly via WebSocket
- User-to-socket mapping for targeted delivery

### Push Notifications (Web Push)

- VAPID-based browser push notifications
- Subscribe/unsubscribe endpoints
- Automatic cleanup of expired subscriptions

### Email Notifications

- Transactional emails via Brevo
- Toggle email notifications per user
- Weekly digest for customers

### Notification Preferences

Per-user notification toggles:

- Delivery alerts
- Order updates
- Promotions
- Review reminders
- Weekly digest
- Wishlist sale alerts

---

## Caching Strategy

Redis caching with TTL-based invalidation:

| Cache Key Pattern        | TTL    | Description              |
| ------------------------ | ------ | ------------------------ |
| `categories:all`         | 1 hour | All categories           |
| `categories:featured`    | 1 hour | Featured categories      |
| `featured_products`      | 30 min | Featured products        |
| `bestsellers`            | 30 min | Best-selling products    |
| `new_arrivals`           | 30 min | New arrivals             |
| `brands:featured`        | 1 hour | Featured brands          |
| `stores:all`             | 30 min | All stores               |
| `products:list:*`        | 10 min | Product list queries     |
| `products:search:*`      | 5 min  | Search results           |
| `products:suggestions:*` | 5 min  | Search suggestions       |
| `reviews:product:*`      | 10 min | Product reviews          |
| `recently_viewed:*`      | 7 days | Per-user recently viewed |
| `leaderboard`            | 1 week | Vendor leaderboard       |

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# With coverage
npm run test:cov
```

Test setup uses Jest + Supertest with a dedicated test configuration. Current test coverage includes:

- Auth flows (signup, signin, token refresh)
- Product endpoints (CRUD, search)

---

## 📄 License

This is a private project. All rights reserved.
