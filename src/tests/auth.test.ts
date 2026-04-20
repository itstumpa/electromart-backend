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

  describe("POST /api/auth/signup", () => {
    it("should register a new user", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send(TEST_USER);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBe(TEST_USER.email);
    });

    it("should reject duplicate email", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send(TEST_USER);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it("should reject missing fields", async () => {
      const res = await request(app)
        .post("/api/auth/signup")
        .send({ email: "missing@test.com" });

      expect(res.statusCode).toBe(400);
    });
  });

  describe("POST /api/auth/signin", () => {
    beforeAll(async () => {
      // manually verify email for test user
      await prisma.user.update({
        where: { email: TEST_USER.email },
        data: { isEmailVerified: true },
      });
    });

    it("should sign in successfully", async () => {
      const res = await request(app)
        .post("/api/auth/signin")
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.statusCode).toBe(200);
      expect(res.body.data.accessToken).toBeDefined();
      accessToken = res.body.data.accessToken;
    });

    it("should reject wrong password", async () => {
      const res = await request(app)
        .post("/api/auth/signin")
        .send({ email: TEST_USER.email, password: "wrongpassword" });

      expect(res.statusCode).toBe(401);
    });
  });

  describe("GET /api/auth/me", () => {
    it("should return current user with valid token", async () => {
      const res = await request(app)
        .get("/api/auth/me")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(TEST_USER.email);
    });

    it("should reject without token", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.statusCode).toBe(401);
    });
  });
});