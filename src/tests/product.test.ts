// tests/product.test.ts
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

let categoryId: string;
let productId: string;

describe("Product API", () => {
  const agent = request.agent(app); // ✅ cookie session

  // ─────────────────────────────────────────────
  // AUTH (VENDOR LOGIN)
  // ─────────────────────────────────────────────
  beforeAll(async () => {
    // login as vendor (cookie stored automatically)
    await agent
      .post("/api/v1/auth/signin")
      .send({
        email: process.env.VENDOR_ONE_EMAIL,
        password: process.env.VENDOR_ONE_PASSWORD,
      });

    // get category
    const cat = await prisma.category.findFirst();
    categoryId = cat?.id ?? "";
  });

  afterAll(async () => {
    if (productId) {
      await prisma.product.deleteMany({
        where: { name: "Test Product" },
      });
    }
  });

  // ─────────────────────────────────────────────
  // GET PRODUCTS
  // ─────────────────────────────────────────────
  describe("GET /api/v1/products", () => {
    it("should return paginated products", async () => {
      const res = await request(app)
        .get("/api/v1/products")
        .query({ page: 1, limit: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should filter by search query", async () => {
      const res = await request(app)
        .get("/api/v1/products")
        .query({ search: "phone" });

      expect(res.statusCode).toBe(200);
    });
  });

  // ─────────────────────────────────────────────
  // CREATE PRODUCT
  // ─────────────────────────────────────────────
  describe("POST /api/v1/products", () => {
    it("should create a product as vendor", async () => {
      const res = await agent
        .post("/api/v1/products")
        .send({
          name: "Test Product",
          price: 99.99,
          stock: 10,
          categoryId,
          description: "Test description",
        });

      expect(res.statusCode).toBe(201);
      expect(res.body.data.name).toBe("Test Product");

      productId = res.body.data.id;
    });

    it("should reject without auth", async () => {
      const res = await request(app)
        .post("/api/v1/products")
        .send({ name: "Unauthorized" });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // GET PRODUCT BY ID
  // ─────────────────────────────────────────────
  describe("GET /api/v1/products/:id", () => {
    it("should return product by id", async () => {
      const res = await request(app).get(
        `/api/v1/products/${productId}`
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(productId);
    });

    it("should return 404 for unknown product", async () => {
      const res = await request(app).get(
        "/api/v1/products/nonexistent-id-123"
      );

      expect(res.statusCode).toBe(404);
    });
  });
});