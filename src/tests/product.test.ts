// tests/product.test.ts
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

let vendorToken: string;
let categoryId: string;
let productId: string;

describe("Product API", () => {
  beforeAll(async () => {
    // sign in as vendor
    const res = await request(app)
      .post("/api/auth/signin")
      .send({
        email: process.env.VENDOR_ONE_EMAIL,
        password: process.env.VENDOR_ONE_PASSWORD,
      });
    vendorToken = res.body.data?.accessToken;

    // get a category
    const cat = await prisma.category.findFirst();
    categoryId = cat?.id ?? "";
  });

  describe("GET /api/products", () => {
    it("should return paginated products", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ page: 1, limit: 5 });

      expect(res.statusCode).toBe(200);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.page).toBe(1);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("should filter by search query", async () => {
      const res = await request(app)
        .get("/api/products")
        .query({ search: "phone" });

      expect(res.statusCode).toBe(200);
    });
  });

  describe("POST /api/products", () => {
    it("should create a product as vendor", async () => {
      const res = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${vendorToken}`)
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
        .post("/api/products")
        .send({ name: "Unauthorized" });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/products/:id", () => {
    it("should return product by id", async () => {
      if (!productId) return;
      const res = await request(app).get(`/api/products/${productId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data.id).toBe(productId);
    });

    it("should return 404 for unknown product", async () => {
      const res = await request(app).get("/api/products/nonexistent-id-123");
      expect(res.statusCode).toBe(404);
    });
  });

  afterAll(async () => {
    if (productId) {
      await prisma.product.deleteMany({ where: { name: "Test Product" } });
    }
  });
});