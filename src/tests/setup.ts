// tests/setup.ts
import dotenv from "dotenv";
import { prisma } from "../lib/prisma";

dotenv.config();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  // clean test data
  await prisma.user.deleteMany({ where: { email: { contains: "test-" } } });
  await prisma.$disconnect();
});