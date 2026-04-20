// tests/setup.ts
import { prisma } from "../lib/prisma";

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // clean test data
  await prisma.user.deleteMany({ where: { email: { contains: "test-" } } });
  await prisma.$disconnect();
});