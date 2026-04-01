import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";

export const createSuperAdmin = async () => {
       try {
    console.log("🔍 Checking super admin...");

    const email = process.env.SUPER_ADMIN_EMAIL!;
    const password = process.env.SUPER_ADMIN_PASSWORD!;

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      console.log("⚠️ Super admin already exists");
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
             email,
             name: "Super Admin",
        password: hashedPassword,
        role: "ADMIN",
      },
    });

    console.log("✅ Super admin created");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
  } catch (error) {
    console.error("❌ Failed to create super admin", error);
  }
};