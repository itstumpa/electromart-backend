// tests/auth.test.ts
import request from "supertest";
import app from "../app";
import { prisma } from "../lib/prisma";

const TEST_USER = {
  name: "Test User",
  email: "test-auth@electromart.com",
  password: "Test@1234",
};

let accessToken: string;

describe("Auth API", () => {
  beforeAll(async () => {
    await prisma.user.deleteMany({ where: { email: TEST_USER.email } });
  });

  describe("POST /api/v1/auth/signup", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send(TEST_USER);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(TEST_USER.email);
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send(TEST_USER);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing fields", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signup")
        .send({ email: "missing@test.com" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/v1/auth/signin", () => {
    beforeAll(async () => {
      // manually verify email for test user
 await prisma.user.upsert({
  where: { email: TEST_USER.email },
  update: {
    isEmailVerified: true,
  },
  create: {
    name: TEST_USER.name,
    email: TEST_USER.email,
    password: "hashedPassword", // or match your real hash logic
    isEmailVerified: true,
  },
});
    });

    it("should sign in successfully", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signin")
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/v1/auth/signin")
        .send({ email: TEST_USER.email, password: "wrongpassword" });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("should return current user with valid token", async () => {
      const res = await request(app)
        .get("/api/v1/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(TEST_USER.email);
    });

    it("should reject without token", async () => {
      const res = await request(app).get("/api/v1/auth/me");
      expect(res.statusCode).toBe(401);
    });
  });
});