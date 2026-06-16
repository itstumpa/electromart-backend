// src/config/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
const API_VERSION_PREFIX = '/api/v1';
const LOCAL_SERVER_URL = `${process.env.BACKEND_URL || ''}${API_VERSION_PREFIX}`;

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Electromart API',
      version: '2.0.0',
      description: 'Production-grade multi-vendor e-commerce REST API',
      contact: { name: 'Electromart Dev Team-itsTumpa' },
    },
    servers: [
      { url: LOCAL_SERVER_URL, description: 'Development' },
      { url: `${process.env.BACKEND_URL || ''}${API_VERSION_PREFIX}`, description: 'Production' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        PaginationMeta: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 100 },
            totalPages: { type: 'integer', example: 10 },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            statusCode: { type: 'integer', example: 200 },
            message: { type: 'string' },
            data: { type: 'object' },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            statusCode: { type: 'integer', example: 400 },
            message: { type: 'string' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            meta: { $ref: '#/components/schemas/PaginationMeta' },
            data: { type: 'array', items: { type: 'object' } },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
    tags: [
      { name: 'System', description: 'Health check + system' },
      { name: 'Auth', description: 'Authentication' },
      { name: 'Users', description: 'User management' },
      { name: 'Addresses', description: 'Shipping address book' },
      { name: 'Stores', description: 'Vendor store management' },
      { name: 'Products', description: 'Product management' },
      { name: 'Tags', description: 'Product tags' },
      { name: 'Product Q&A', description: 'Product questions & answers' },
      { name: 'Categories', description: 'Categories' },
      { name: 'Cart', description: 'Shopping cart' },
      { name: 'Coupons', description: 'Discount coupons' },
      { name: 'Orders', description: 'Order management' },
      { name: 'Order Tracking', description: 'Order timeline' },
      { name: 'Payments', description: 'Payment gateway' },
      { name: 'Reviews', description: 'Product reviews' },
      { name: 'Returns', description: 'Return & refund requests' },
      { name: 'Stock Alerts', description: 'Back-in-stock alerts' },
      { name: 'Notifications', description: 'In-app notifications' },
      { name: 'Admin', description: 'Admin dashboard' },
      { name: 'Vendor Analytics', description: 'Vendor analytics' },
      { name: 'Leaderboard', description: 'Vendor leaderboard' },
    ],
    paths: {
      // ── SYSTEM ────────────────────────────────────────────────────────────
      '/health': {
        get: {
          tags: ['System'],
          summary: 'Health check',
          security: [],
          responses: {
            200: {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'ok' },
                      uptime: { type: 'number' },
                      timestamp: { type: 'string' },
                      environment: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },

      // ── AUTH ──────────────────────────────────────────────────────────────
      '/auth/signup': {
        post: {
          tags: ['Auth'],
          summary: 'Register',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password'],
                  properties: {
                    name: { type: 'string', example: 'John Doe' },
                    email: { type: 'string', example: 'john@example.com' },
                    password: { type: 'string', example: 'Password@123' },
                    role: { type: 'string', enum: ['CUSTOMER', 'VENDOR'] },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Account created' }, 409: { description: 'Email in use' } },
        },
      },
      '/auth/signin': {
        post: {
          tags: ['Auth'],
          summary: 'Sign in',
          security: [],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['email', 'password'],
                  properties: {
                    email: { type: 'string' },
                    password: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Tokens returned' }, 401: { description: 'Invalid credentials' } },
        },
      },
      '/auth/verify-email': {
        post: { tags: ['Auth'], summary: 'Verify email token', security: [], responses: { 200: { description: 'Verified' } } },
      },
      '/auth/resend-verification': {
        post: { tags: ['Auth'], summary: 'Resend verification email', security: [], responses: { 200: { description: 'Sent' } } },
      },
      '/auth/refresh-token': {
        post: {
          tags: ['Auth'],
          summary: 'Refresh access token',
          security: [],
          responses: { 200: { description: 'New access token' } },
        },
      },
      '/auth/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Request password reset',
          security: [],
          responses: { 200: { description: 'Code sent' } },
        },
      },
      '/auth/verify-reset-code': {
        post: { tags: ['Auth'], summary: 'Verify reset code', security: [], responses: { 200: { description: 'Valid' } } },
      },
      '/auth/reset-password': {
        post: { tags: ['Auth'], summary: 'Reset password', security: [], responses: { 200: { description: 'Reset done' } } },
      },
      '/auth/me': { get: { tags: ['Auth'], summary: 'Get current user', responses: { 200: { description: 'Current user' } } } },
      '/auth/logout': { post: { tags: ['Auth'], summary: 'Logout', responses: { 200: { description: 'Logged out' } } } },
      '/auth/change-password': {
        post: { tags: ['Auth'], summary: 'Change password', responses: { 200: { description: 'Changed' } } },
      },

      // ── USERS ─────────────────────────────────────────────────────────────
      '/users': {
        get: {
          tags: ['Users'],
          summary: 'Get all users (Admin)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string' } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: { 200: { description: 'Users list' } },
        },
      },
      '/users/{id}': {
        get: {
          tags: ['Users'],
          summary: 'Get user by ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'User' } },
        },
        patch: {
          tags: ['Users'],
          summary: 'Update own profile',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Users'],
          summary: 'Delete user (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/users/{id}/role': {
        patch: {
          tags: ['Users'],
          summary: 'Change user role (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Role updated' } },
        },
      },

      // ── ADDRESSES ─────────────────────────────────────────────────────────
      '/addresses': {
        get: { tags: ['Addresses'], summary: 'Get my addresses', responses: { 200: { description: 'Addresses' } } },
        post: { tags: ['Addresses'], summary: 'Add new address', responses: { 201: { description: 'Created' } } },
      },
      '/addresses/{id}': {
        get: {
          tags: ['Addresses'],
          summary: 'Get address by ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Address' } },
        },
        patch: {
          tags: ['Addresses'],
          summary: 'Update address',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Addresses'],
          summary: 'Delete address',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/addresses/{id}/default': {
        patch: {
          tags: ['Addresses'],
          summary: 'Set default address',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Default set' } },
        },
      },

      // ── STORES ────────────────────────────────────────────────────────────
      '/stores': {
        get: {
          tags: ['Stores'],
          summary: 'Get all stores (paginated)',
          security: [],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string' } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: { 200: { description: 'Paginated stores' } },
        },
        post: { tags: ['Stores'], summary: 'Create store (Vendor)', responses: { 201: { description: 'Created' } } },
      },
      '/stores/my/store': {
        get: { tags: ['Stores'], summary: 'Get my store (Vendor)', responses: { 200: { description: 'My store' } } },
      },
      '/stores/{id}': {
        get: {
          tags: ['Stores'],
          summary: 'Get store by ID',
          security: [],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Store' } },
        },
        patch: {
          tags: ['Stores'],
          summary: 'Update store',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Stores'],
          summary: 'Delete store (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── PRODUCTS ──────────────────────────────────────────────────────────
      '/products': {
        get: {
          tags: ['Products'],
          summary: 'Get all products (paginated)',
          security: [],
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['price', 'createdAt', 'name'] } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'categoryId', schema: { type: 'string' } },
            { in: 'query', name: 'storeId', schema: { type: 'string' } },
            { in: 'query', name: 'minPrice', schema: { type: 'number' } },
            { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
          ],
          responses: { 200: { description: 'Paginated products with meta' } },
        },
        post: { tags: ['Products'], summary: 'Create product (Vendor)', responses: { 201: { description: 'Created' } } },
      },
      '/products/recently-viewed': {
        get: {
          tags: ['Products'],
          summary: 'Get recently viewed (Redis)',
          responses: { 200: { description: 'Recent products' } },
        },
      },
      '/products/my/products': {
        get: {
          tags: ['Products'],
          summary: 'Get my products (Vendor, paginated)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'My products' } },
        },
      },
      '/products/search': {
        get: {
          tags: ['Products'],
          summary: 'Full-text product search',
          security: [],
          parameters: [
            { in: 'query', name: 'q', schema: { type: 'string' } },
            { in: 'query', name: 'categoryId', schema: { type: 'string' } },
            { in: 'query', name: 'minPrice', schema: { type: 'number' } },
            { in: 'query', name: 'maxPrice', schema: { type: 'number' } },
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Search results' } },
        },
      },
      '/products/search/suggestions': {
        get: {
          tags: ['Products'],
          summary: 'Autocomplete suggestions',
          security: [],
          parameters: [{ in: 'query', name: 'q', schema: { type: 'string' } }],
          responses: { 200: { description: 'Suggestions' } },
        },
      },
      '/products/{id}': {
        get: {
          tags: ['Products'],
          summary: 'Get product by ID (tracks recently viewed)',
          security: [],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Product' } },
        },
        patch: {
          tags: ['Products'],
          summary: 'Update product',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Products'],
          summary: 'Delete product',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/products/{id}/images': {
        post: {
          tags: ['Products'],
          summary: 'Upload images (queued via BullMQ → 202)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 202: { description: 'Upload queued' } },
        },
      },
      '/products/{id}/images/{imageId}': {
        delete: {
          tags: ['Products'],
          summary: 'Delete product image',
          parameters: [
            { in: 'path', name: 'id', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'imageId', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── TAGS ──────────────────────────────────────────────────────────────
      '/tags': {
        get: { tags: ['Tags'], summary: 'Get all tags', security: [], responses: { 200: { description: 'Tags' } } },
        post: { tags: ['Tags'], summary: 'Create tag (Admin)', responses: { 201: { description: 'Created' } } },
      },
      '/tags/{id}': {
        delete: {
          tags: ['Tags'],
          summary: 'Delete tag (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },
      '/tags/{slug}/products': {
        get: {
          tags: ['Tags'],
          summary: 'Get products by tag',
          security: [],
          parameters: [{ in: 'path', name: 'slug', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Products' } },
        },
      },
      '/tags/product/{productId}': {
        post: {
          tags: ['Tags'],
          summary: 'Add tags to product (Vendor)',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Tags added' } },
        },
      },
      '/tags/product/{productId}/{tagId}': {
        delete: {
          tags: ['Tags'],
          summary: 'Remove tag from product (Vendor)',
          parameters: [
            { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
            { in: 'path', name: 'tagId', required: true, schema: { type: 'string' } },
          ],
          responses: { 200: { description: 'Removed' } },
        },
      },

      // ── PRODUCT Q&A ───────────────────────────────────────────────────────
      '/qa/product/{productId}': {
        get: {
          tags: ['Product Q&A'],
          summary: 'Get product Q&A',
          security: [],
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Q&A list' } },
        },
        post: {
          tags: ['Product Q&A'],
          summary: 'Ask question (Customer)',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Question submitted' } },
        },
      },
      '/qa/{questionId}/answer': {
        patch: {
          tags: ['Product Q&A'],
          summary: 'Answer question (Vendor)',
          parameters: [{ in: 'path', name: 'questionId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Answered' } },
        },
      },
      '/qa/{questionId}': {
        delete: {
          tags: ['Product Q&A'],
          summary: 'Delete question',
          parameters: [{ in: 'path', name: 'questionId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── CATEGORIES ────────────────────────────────────────────────────────
      '/categories': {
        get: {
          tags: ['Categories'],
          summary: 'Get all categories',
          security: [],
          responses: { 200: { description: 'Categories' } },
        },
        post: { tags: ['Categories'], summary: 'Create (Admin)', responses: { 201: { description: 'Created' } } },
      },
      '/categories/{id}': {
        get: {
          tags: ['Categories'],
          summary: 'Get by ID',
          security: [],
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Category' } },
        },
        patch: {
          tags: ['Categories'],
          summary: 'Update (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Categories'],
          summary: 'Delete (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── CART ──────────────────────────────────────────────────────────────
      '/cart': {
        get: { tags: ['Cart'], summary: 'View cart', responses: { 200: { description: 'Cart with total' } } },
        post: {
          tags: ['Cart'],
          summary: 'Add to cart',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: { productId: { type: 'string' }, quantity: { type: 'integer', minimum: 1 } },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated cart' } },
        },
        delete: { tags: ['Cart'], summary: 'Clear cart', responses: { 200: { description: 'Cleared' } } },
      },
      '/cart/merge': {
        post: {
          tags: ['Cart'],
          summary: 'Merge guest cart (call after login)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    items: {
                      type: 'array',
                      items: { type: 'object', properties: { productId: { type: 'string' }, quantity: { type: 'integer' } } },
                    },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Merged' } },
        },
      },
      '/cart/{productId}': {
        patch: {
          tags: ['Cart'],
          summary: 'Update item qty',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Cart'],
          summary: 'Remove item',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Removed' } },
        },
      },

      // ── COUPONS ───────────────────────────────────────────────────────────
      '/coupons': {
        get: { tags: ['Coupons'], summary: 'Get all coupons (Admin)', responses: { 200: { description: 'Coupons' } } },
        post: { tags: ['Coupons'], summary: 'Create coupon (Admin)', responses: { 201: { description: 'Created' } } },
      },
      '/coupons/apply': {
        post: {
          tags: ['Coupons'],
          summary: 'Preview coupon discount on cart (Customer)',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', properties: { code: { type: 'string' } } } } },
          },
          responses: { 200: { description: 'Discount preview' } },
        },
      },
      '/coupons/{id}/toggle': {
        patch: {
          tags: ['Coupons'],
          summary: 'Toggle active/inactive (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Toggled' } },
        },
      },
      '/coupons/{id}': {
        delete: {
          tags: ['Coupons'],
          summary: 'Delete coupon (Admin)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── ORDERS ────────────────────────────────────────────────────────────
      '/orders': {
        post: {
          tags: ['Orders'],
          summary: 'Place order from cart',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    shippingAddress: { type: 'string' },
                    addressId: { type: 'string', description: 'Pick saved address' },
                    couponCode: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Order placed' } },
        },
        get: {
          tags: ['Orders'],
          summary: 'Get all orders (Admin, paginated)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'status', schema: { type: 'string' } },
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string' } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: { 200: { description: 'Orders' } },
        },
      },
      '/orders/my': {
        get: {
          tags: ['Orders'],
          summary: 'My orders (Customer, paginated)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'My orders' } },
        },
      },
      '/orders/{id}': {
        get: {
          tags: ['Orders'],
          summary: 'Get order by ID',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Order' } },
        },
      },
      '/orders/{id}/cancel': {
        patch: {
          tags: ['Orders'],
          summary: 'Cancel order (Customer)',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Cancelled' } },
        },
      },
      '/orders/vendor/items': {
        get: {
          tags: ['Orders'],
          summary: 'Vendor order items (paginated)',
          parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }],
          responses: { 200: { description: 'Vendor items' } },
        },
      },
      '/orders/vendor/items/{itemId}/status': {
        patch: {
          tags: ['Orders'],
          summary: 'Update item status (Vendor)',
          parameters: [{ in: 'path', name: 'itemId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
      },

      // ── ORDER TRACKING ────────────────────────────────────────────────────
      '/orders/{orderId}/timeline': {
        get: {
          tags: ['Order Tracking'],
          summary: 'Get order timeline / status history',
          parameters: [{ in: 'path', name: 'orderId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Timeline events' } },
        },
      },

      // ── PAYMENTS ──────────────────────────────────────────────────────────
      '/payments/initiate': {
        post: {
          tags: ['Payments'],
          summary: 'Initiate payment (SSLCommerz or Stripe)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['orderId', 'gateway'],
                  properties: { orderId: { type: 'string' }, gateway: { type: 'string', enum: ['SSLCOMMERZ', 'STRIPE'] } },
                },
              },
            },
          },
          responses: { 200: { description: 'Gateway URL returned' } },
        },
      },
      '/payments/order/{orderId}': {
        get: {
          tags: ['Payments'],
          summary: 'Get payment status',
          parameters: [{ in: 'path', name: 'orderId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Payment' } },
        },
      },
      '/payments/refund/{orderId}': {
        post: {
          tags: ['Payments'],
          summary: 'Refund payment (Admin)',
          parameters: [{ in: 'path', name: 'orderId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Refunded' } },
        },
      },
      '/payments/sslcommerz/success': {
        post: {
          tags: ['Payments'],
          summary: 'SSLCommerz success callback',
          security: [],
          responses: { 302: { description: 'Redirects to frontend' } },
        },
      },
      '/payments/sslcommerz/fail': {
        post: {
          tags: ['Payments'],
          summary: 'SSLCommerz fail callback',
          security: [],
          responses: { 302: { description: 'Redirects to frontend' } },
        },
      },
      '/payments/sslcommerz/cancel': {
        post: {
          tags: ['Payments'],
          summary: 'SSLCommerz cancel callback',
          security: [],
          responses: { 302: { description: 'Redirects to frontend' } },
        },
      },
      '/payments/sslcommerz/ipn': {
        post: {
          tags: ['Payments'],
          summary: 'SSLCommerz IPN webhook',
          security: [],
          responses: { 200: { description: 'Received' } },
        },
      },
      '/payments/stripe/webhook': {
        post: { tags: ['Payments'], summary: 'Stripe webhook', security: [], responses: { 200: { description: 'Received' } } },
      },

      // ── REVIEWS ───────────────────────────────────────────────────────────
      '/reviews/product/{productId}': {
        get: {
          tags: ['Reviews'],
          summary: 'Get product reviews (paginated)',
          security: [],
          parameters: [
            { in: 'path', name: 'productId', required: true, schema: { type: 'string' } },
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
            { in: 'query', name: 'sortBy', schema: { type: 'string', enum: ['rating', 'createdAt'] } },
            { in: 'query', name: 'sortOrder', schema: { type: 'string', enum: ['asc', 'desc'] } },
          ],
          responses: { 200: { description: 'Reviews + avg rating' } },
        },
        post: {
          tags: ['Reviews'],
          summary: 'Submit review (Customer, must have delivered order)',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Submitted' } },
        },
      },
      '/reviews/my': {
        get: { tags: ['Reviews'], summary: 'My reviews (Customer)', responses: { 200: { description: 'My reviews' } } },
      },
      '/reviews/{reviewId}': {
        patch: {
          tags: ['Reviews'],
          summary: 'Update review (Customer)',
          parameters: [{ in: 'path', name: 'reviewId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Updated' } },
        },
        delete: {
          tags: ['Reviews'],
          summary: 'Delete review',
          parameters: [{ in: 'path', name: 'reviewId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Deleted' } },
        },
      },

      // ── RETURNS ───────────────────────────────────────────────────────────
      '/returns/order-item/{orderItemId}': {
        post: {
          tags: ['Returns'],
          summary: 'Request return (Customer, delivered items only)',
          parameters: [{ in: 'path', name: 'orderItemId', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Submitted' } },
        },
      },
      '/returns/my': {
        get: { tags: ['Returns'], summary: 'My return requests (Customer)', responses: { 200: { description: 'My returns' } } },
      },
      '/returns/vendor': {
        get: {
          tags: ['Returns'],
          summary: 'Vendor return requests (paginated)',
          parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }],
          responses: { 200: { description: 'Vendor returns' } },
        },
      },
      '/returns/{returnId}/resolve': {
        patch: {
          tags: ['Returns'],
          summary: 'Approve or reject return (Vendor)',
          parameters: [{ in: 'path', name: 'returnId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Resolved' } },
        },
      },

      // ── STOCK ALERTS ──────────────────────────────────────────────────────
      '/stock-alerts': {
        get: { tags: ['Stock Alerts'], summary: 'My alerts (Customer)', responses: { 200: { description: 'Alerts' } } },
      },
      '/stock-alerts/{productId}/subscribe': {
        post: {
          tags: ['Stock Alerts'],
          summary: 'Subscribe to back-in-stock alert',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 201: { description: 'Subscribed' } },
        },
      },
      '/stock-alerts/{productId}/unsubscribe': {
        delete: {
          tags: ['Stock Alerts'],
          summary: 'Unsubscribe from alert',
          parameters: [{ in: 'path', name: 'productId', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Unsubscribed' } },
        },
      },

      // ── NOTIFICATIONS ─────────────────────────────────────────────────────
      '/notifications': {
        get: {
          tags: ['Notifications'],
          summary: 'Get my notifications (last 50)',
          responses: { 200: { description: 'Notifications' } },
        },
      },
      '/notifications/unread-count': {
        get: { tags: ['Notifications'], summary: 'Get unread count (badge)', responses: { 200: { description: 'Count' } } },
      },
      '/notifications/mark-all-read': {
        patch: { tags: ['Notifications'], summary: 'Mark all as read', responses: { 200: { description: 'Done' } } },
      },
      '/notifications/{id}/read': {
        patch: {
          tags: ['Notifications'],
          summary: 'Mark single as read',
          parameters: [{ in: 'path', name: 'id', required: true, schema: { type: 'string' } }],
          responses: { 200: { description: 'Done' } },
        },
      },
      '/notifications/push/vapid-key': {
        get: {
          tags: ['Notifications'],
          summary: 'Get VAPID public key (needed by frontend for push subscription)',
          security: [],
          responses: { 200: { description: 'Public key' } },
        },
      },
      '/notifications/push/subscribe': {
        post: {
          tags: ['Notifications'],
          summary: 'Save push subscription (browser)',
          responses: { 201: { description: 'Saved' } },
        },
      },

      // ── ADMIN ─────────────────────────────────────────────────────────────
      '/admin/dashboard': {
        get: {
          tags: ['Admin'],
          summary: 'Full overview (revenue, users, orders, top products)',
          responses: { 200: { description: 'Dashboard data' } },
        },
      },
      '/admin/revenue/stores': {
        get: {
          tags: ['Admin'],
          summary: 'Revenue by store (paginated)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Store revenues' } },
        },
      },
      '/admin/payments/recent': {
        get: {
          tags: ['Admin'],
          summary: 'Recent payments (paginated)',
          parameters: [{ in: 'query', name: 'page', schema: { type: 'integer' } }],
          responses: { 200: { description: 'Payments' } },
        },
      },
      '/admin/vendors': {
        get: {
          tags: ['Admin'],
          summary: 'All vendors (search + filter + paginated)',
          parameters: [
            { in: 'query', name: 'search', schema: { type: 'string' } },
            { in: 'query', name: 'isActive', schema: { type: 'boolean' } },
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Vendors' } },
        },
      },
      '/admin/products/top-selling': {
        get: {
          tags: ['Admin'],
          summary: 'Top selling products (paginated)',
          parameters: [
            { in: 'query', name: 'page', schema: { type: 'integer' } },
            { in: 'query', name: 'limit', schema: { type: 'integer' } },
          ],
          responses: { 200: { description: 'Top products' } },
        },
      },

      // ── VENDOR ANALYTICS ──────────────────────────────────────────────────
      '/vendor/analytics': {
        get: {
          tags: ['Vendor Analytics'],
          summary: 'My store analytics (revenue, orders, top products, customers)',
          responses: { 200: { description: 'Analytics data' } },
        },
      },

      // ── LEADERBOARD ───────────────────────────────────────────────────────
      '/leaderboard': {
        get: {
          tags: ['Leaderboard'],
          summary: 'Vendor leaderboard (cached in Redis, recomputed Fridays 2AM)',
          security: [],
          responses: { 200: { description: 'Ranked vendors' } },
        },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
