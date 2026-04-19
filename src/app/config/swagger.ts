// src/config/swagger.ts
import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ElectroMart API",
      version: "1.0.0",
      description: "Multi-vendor e-commerce REST API documentation",
    },
    servers: [
      {
        url: process.env.API_URL || "http://localhost:5000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        // ── Auth ──────────────────────────────────────────────────────────
        SignupRequest: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "John Doe" },
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "password123" },
            role: { type: "string", enum: ["CUSTOMER", "VENDOR"] },
          },
        },
        SigninRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", example: "john@example.com" },
            password: { type: "string", example: "password123" },
          },
        },
        // ── Product ───────────────────────────────────────────────────────
        CreateProductRequest: {
          type: "object",
          required: ["name", "price", "categoryId"],
          properties: {
            name: { type: "string", example: "iPhone 15" },
            description: { type: "string" },
            price: { type: "number", example: 999.99 },
            stock: { type: "integer", example: 50 },
            categoryId: { type: "string" },
            images: {
              type: "array",
              items: {
                type: "object",
                properties: { url: { type: "string" } },
              },
            },
          },
        },
        // ── Review ────────────────────────────────────────────────────────
        CreateReviewRequest: {
          type: "object",
          required: ["rating"],
          properties: {
            rating: { type: "integer", minimum: 1, maximum: 5, example: 4 },
            comment: { type: "string", example: "Great product!" },
          },
        },
        // ── Pagination Meta ───────────────────────────────────────────────
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer" },
            limit: { type: "integer" },
            total: { type: "integer" },
            totalPages: { type: "integer" },
          },
        },
        // ── Generic Response ──────────────────────────────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            statusCode: { type: "integer", example: 200 },
            message: { type: "string" },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            statusCode: { type: "integer", example: 400 },
            message: { type: "string" },
          },
        },
      },
    },
    // apply bearer auth globally
    security: [{ bearerAuth: [] }],
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User management" },
      { name: "Stores", description: "Vendor store management" },
      { name: "Products", description: "Product management" },
      { name: "Categories", description: "Category management" },
      { name: "Cart", description: "Shopping cart" },
      { name: "Orders", description: "Order management" },
      { name: "Reviews", description: "Product reviews" },
      { name: "Admin", description: "Admin dashboard & analytics" },
    ],
    paths: {
      // ── AUTH ─────────────────────────────────────────────────────────────
      "/api/auth/signup": {
        post: {
          tags: ["Auth"],
          summary: "Register a new user",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SignupRequest" },
              },
            },
          },
          responses: {
            201: { description: "Account created. Please verify your email." },
            409: { description: "Email already in use" },
          },
        },
      },
      "/api/auth/signin": {
        post: {
          tags: ["Auth"],
          summary: "Sign in",
          security: [],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SigninRequest" },
              },
            },
          },
          responses: {
            200: { description: "Signed in successfully" },
            401: { description: "Invalid credentials" },
          },
        },
      },
      "/api/auth/verify-email": {
        post: { tags: ["Auth"], summary: "Verify email with token", security: [], responses: { 200: { description: "Email verified" } } },
      },
      "/api/auth/refresh-token": {
        post: { tags: ["Auth"], summary: "Refresh access token", security: [], responses: { 200: { description: "Token refreshed" } } },
      },
      "/api/auth/forgot-password": {
        post: { tags: ["Auth"], summary: "Request password reset code", security: [], responses: { 200: { description: "Reset code sent" } } },
      },
      "/api/auth/reset-password": {
        post: { tags: ["Auth"], summary: "Reset password with code", security: [], responses: { 200: { description: "Password reset" } } },
      },
      "/api/auth/me": {
        get: { tags: ["Auth"], summary: "Get current user", responses: { 200: { description: "Current user" } } },
      },
      "/api/auth/logout": {
        post: { tags: ["Auth"], summary: "Logout", responses: { 200: { description: "Logged out" } } },
      },
      "/api/auth/change-password": {
        post: { tags: ["Auth"], summary: "Change password", responses: { 200: { description: "Password changed" } } },
      },

      // ── USERS ─────────────────────────────────────────────────────────────
      "/api/users": {
        get: { tags: ["Users"], summary: "Get all users (Admin)", responses: { 200: { description: "Users list" } } },
      },
      "/api/users/{id}": {
        get: { tags: ["Users"], summary: "Get user by ID", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "User" }, 404: { description: "Not found" } } },
        patch: { tags: ["Users"], summary: "Update own profile", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Users"], summary: "Delete user (Admin)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
      },

      // ── STORES ────────────────────────────────────────────────────────────
      "/api/stores": {
        get: { tags: ["Stores"], summary: "Get all stores", security: [], responses: { 200: { description: "Stores" } } },
        post: { tags: ["Stores"], summary: "Create store (Vendor)", responses: { 201: { description: "Store created" } } },
      },
      "/api/stores/my/store": {
        get: { tags: ["Stores"], summary: "Get my store (Vendor)", responses: { 200: { description: "My store" } } },
      },
      "/api/stores/{id}": {
        get: { tags: ["Stores"], summary: "Get store by ID", security: [], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Store" } } },
        patch: { tags: ["Stores"], summary: "Update store (Vendor)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Stores"], summary: "Delete store (Admin)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
      },

      // ── PRODUCTS ──────────────────────────────────────────────────────────
      "/api/products": {
        get: {
          tags: ["Products"],
          summary: "Get all products (paginated)",
          security: [],
          parameters: [
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
            { in: "query", name: "search", schema: { type: "string" } },
            { in: "query", name: "categoryId", schema: { type: "string" } },
            { in: "query", name: "storeId", schema: { type: "string" } },
            { in: "query", name: "minPrice", schema: { type: "number" } },
            { in: "query", name: "maxPrice", schema: { type: "number" } },
            { in: "query", name: "sortBy", schema: { type: "string" } },
            { in: "query", name: "sortOrder", schema: { type: "string", enum: ["asc", "desc"] } },
          ],
          responses: { 200: { description: "Products with pagination meta" } },
        },
        post: { tags: ["Products"], summary: "Create product (Vendor)", responses: { 201: { description: "Product created" } } },
      },
      "/api/products/my/products": {
        get: { tags: ["Products"], summary: "Get my products (Vendor)", responses: { 200: { description: "My products" } } },
      },
      "/api/products/{id}": {
        get: { tags: ["Products"], summary: "Get product by ID", security: [], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Product" } } },
        patch: { tags: ["Products"], summary: "Update product", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Products"], summary: "Delete product", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
      },
      "/api/products/{id}/images": {
        post: { tags: ["Products"], summary: "Upload product images (Vendor)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 201: { description: "Images uploaded" } } },
      },

      // ── CATEGORIES ────────────────────────────────────────────────────────
      "/api/categories": {
        get: { tags: ["Categories"], summary: "Get all categories", security: [], responses: { 200: { description: "Categories" } } },
        post: { tags: ["Categories"], summary: "Create category (Admin)", responses: { 201: { description: "Created" } } },
      },
      "/api/categories/{id}": {
        get: { tags: ["Categories"], summary: "Get category by ID", security: [], parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Category" } } },
        patch: { tags: ["Categories"], summary: "Update category (Admin)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Categories"], summary: "Delete category (Admin)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
      },

      // ── CART ──────────────────────────────────────────────────────────────
      "/api/cart": {
        get: { tags: ["Cart"], summary: "View cart", responses: { 200: { description: "Cart" } } },
        post: { tags: ["Cart"], summary: "Add item to cart", responses: { 200: { description: "Cart updated" } } },
        delete: { tags: ["Cart"], summary: "Clear cart", responses: { 200: { description: "Cleared" } } },
      },
      "/api/cart/merge": {
        post: { tags: ["Cart"], summary: "Merge guest cart into DB cart", responses: { 200: { description: "Merged" } } },
      },
      "/api/cart/{productId}": {
        patch: { tags: ["Cart"], summary: "Update cart item quantity", parameters: [{ in: "path", name: "productId", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Cart"], summary: "Remove cart item", parameters: [{ in: "path", name: "productId", required: true, schema: { type: "string" } }], responses: { 200: { description: "Removed" } } },
      },

      // ── ORDERS ────────────────────────────────────────────────────────────
      "/api/orders": {
        post: { tags: ["Orders"], summary: "Place order from cart", responses: { 201: { description: "Order placed" } } },
        get: { tags: ["Orders"], summary: "Get all orders (Admin)", parameters: [{ in: "query", name: "page", schema: { type: "integer" } }, { in: "query", name: "limit", schema: { type: "integer" } }, { in: "query", name: "status", schema: { type: "string" } }, { in: "query", name: "search", schema: { type: "string" } }], responses: { 200: { description: "Orders" } } },
      },
      "/api/orders/my": {
        get: { tags: ["Orders"], summary: "Get my orders (Customer)", parameters: [{ in: "query", name: "page", schema: { type: "integer" } }, { in: "query", name: "limit", schema: { type: "integer" } }], responses: { 200: { description: "My orders" } } },
      },
      "/api/orders/{id}": {
        get: { tags: ["Orders"], summary: "Get order by ID", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Order" } } },
      },
      "/api/orders/{id}/cancel": {
        patch: { tags: ["Orders"], summary: "Cancel order (Customer)", parameters: [{ in: "path", name: "id", required: true, schema: { type: "string" } }], responses: { 200: { description: "Cancelled" } } },
      },
      "/api/orders/vendor/items": {
        get: { tags: ["Orders"], summary: "Get vendor order items", responses: { 200: { description: "Vendor items" } } },
      },
      "/api/orders/vendor/items/{itemId}/status": {
        patch: { tags: ["Orders"], summary: "Update order item status (Vendor)", parameters: [{ in: "path", name: "itemId", required: true, schema: { type: "string" } }], responses: { 200: { description: "Status updated" } } },
      },

      // ── REVIEWS ───────────────────────────────────────────────────────────
      "/api/reviews/product/{productId}": {
        get: {
          tags: ["Reviews"],
          summary: "Get product reviews (paginated)",
          security: [],
          parameters: [
            { in: "path", name: "productId", required: true, schema: { type: "string" } },
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "Reviews with average rating" } },
        },
        post: { tags: ["Reviews"], summary: "Create review (Customer, must have delivered order)", parameters: [{ in: "path", name: "productId", required: true, schema: { type: "string" } }], responses: { 201: { description: "Review submitted" } } },
      },
      "/api/reviews/my": {
        get: { tags: ["Reviews"], summary: "Get my reviews (Customer)", responses: { 200: { description: "My reviews" } } },
      },
      "/api/reviews/{reviewId}": {
        patch: { tags: ["Reviews"], summary: "Update review (Customer)", parameters: [{ in: "path", name: "reviewId", required: true, schema: { type: "string" } }], responses: { 200: { description: "Updated" } } },
        delete: { tags: ["Reviews"], summary: "Delete review (Customer/Admin)", parameters: [{ in: "path", name: "reviewId", required: true, schema: { type: "string" } }], responses: { 200: { description: "Deleted" } } },
      },

      // ── ADMIN ─────────────────────────────────────────────────────────────
      "/api/admin/dashboard": {
        get: { tags: ["Admin"], summary: "Full dashboard overview", responses: { 200: { description: "Overview stats" } } },
      },
      "/api/admin/revenue/stores": {
        get: { tags: ["Admin"], summary: "Revenue by store (paginated)", responses: { 200: { description: "Store revenues" } } },
      },
      "/api/admin/payments/recent": {
        get: { tags: ["Admin"], summary: "Recent payments (paginated)", responses: { 200: { description: "Payments" } } },
      },
      "/api/admin/vendors": {
        get: {
          tags: ["Admin"],
          summary: "Get all vendors (search + filter)",
          parameters: [
            { in: "query", name: "search", schema: { type: "string" } },
            { in: "query", name: "isActive", schema: { type: "boolean" } },
            { in: "query", name: "page", schema: { type: "integer" } },
            { in: "query", name: "limit", schema: { type: "integer" } },
          ],
          responses: { 200: { description: "Vendors" } },
        },
      },
      "/api/admin/products/top-selling": {
        get: { tags: ["Admin"], summary: "Top selling products (paginated)", responses: { 200: { description: "Top products" } } },
      },
    },
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);