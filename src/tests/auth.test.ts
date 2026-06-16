// tests/auth.test.ts
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../app';
import { prisma } from '../lib/prisma';

const TEST_USER = {
  name: 'Test User',
  email: 'itstumpaa@gmail.com',
  password: 'Test@1234',
};

describe('Auth API', () => {
  const agent = request.agent(app);

  // ─────────────────────────────────────────────
  // CLEAN DB BEFORE TESTS
  // ─────────────────────────────────────────────
  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [TEST_USER.email, 'new-test@Electromart.com'],
        },
      },
    });

    await prisma.user.create({
      data: {
        name: TEST_USER.name,
        email: TEST_USER.email,
        password: await bcrypt.hash(TEST_USER.password, 10),
        isEmailVerified: true,
      },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: [TEST_USER.email, 'new-test@Electromart.com'],
        },
      },
    });
  });

  // ─────────────────────────────────────────────
  // SIGNUP
  // ─────────────────────────────────────────────
  describe('POST /api/v1/auth/signup', () => {
    it('should register a new user', async () => {
      const res = await agent.post('/api/v1/auth/signup').send({
        name: 'New User',
        email: 'new-test@Electromart.com',
        password: 'Test@1234',
      });

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.email).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const res = await agent.post('/api/v1/auth/signup').send(TEST_USER);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
    });

    it('should reject missing fields', async () => {
      const res = await agent.post('/api/v1/auth/signup').send({ email: 'missing@test.com' });

      expect(res.statusCode).toBe(400);
    });
  });

  // ─────────────────────────────────────────────
  // SIGNIN
  // ─────────────────────────────────────────────
  describe('POST /api/v1/auth/signin', () => {
    it('should sign in successfully (cookie based)', async () => {
      const res = await agent.post('/api/v1/auth/signin').send({
        email: TEST_USER.email,
        password: TEST_USER.password,
      });

      expect(res.statusCode).toBe(200);

      // ✅ FIXED RESPONSE SHAPE
      expect(res.body.data.user).toBeDefined();
      expect(res.body.data.user.email).toBe(TEST_USER.email);
    });

    it('should reject wrong password', async () => {
      const res = await agent.post('/api/v1/auth/signin').send({
        email: TEST_USER.email,
        password: 'wrongpassword',
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─────────────────────────────────────────────
  // ME (AUTH CHECK)
  // ─────────────────────────────────────────────
  describe('GET /api/v1/auth/me', () => {
    it('should return current user with valid session', async () => {
      const res = await agent.get('/api/v1/auth/me');

      expect(res.statusCode).toBe(200);
      expect(res.body.data.email).toBe(TEST_USER.email);
    });

    it('should reject without token', async () => {
      const freshAgent = request.agent(app);

      const res = await freshAgent.get('/api/v1/auth/me');

      expect(res.statusCode).toBe(401);
    });
  });
});
