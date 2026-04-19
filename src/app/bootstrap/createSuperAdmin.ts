import bcrypt from "bcrypt";
import { prisma } from "../../lib/prisma";

// ✅ helpers
const hashPassword = async (pass: string) => {
  return bcrypt.hash(pass, 10);
};

const generateSlug = (name: string) => {
  return name.toLowerCase().replace(/\s+/g, "-");
};

export const createAdmin = async () => {
  try {
    console.log("\n🔍 Running bootstrap seed...\n");

    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminPassword = process.env.ADMIN_PASSWORD!;

    let admin = await prisma.user.findUnique({
      where: { email: adminEmail },
    });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          name: "Admin",
          email: adminEmail,
          password: await hashPassword(adminPassword),
          role: "ADMIN",
          isEmailVerified: true,
        },
      });
      console.log("✅ Admin created");
    } else {
      console.log("⚠️ Admin already exists");
    }
  } catch (error) {
    console.error("❌ Admin seed failed:", error);
  }
};

export const createCustomer = async () => {
  try {
    const customerEmail = process.env.CUSTOMER_EMAIL!;
    const customerPassword = process.env.CUSTOMER_PASSWORD!;

    let customer = await prisma.user.findUnique({
      where: { email: customerEmail },
    });

    if (!customer) {
      customer = await prisma.user.create({
        data: {
          name: "Customer",
          email: customerEmail,
          password: await hashPassword(customerPassword),
          role: "CUSTOMER",
          isEmailVerified: true,
        },
      });

      console.log("✅ Customer created");
    } else {
      console.log("⚠️ Customer already exists");
    }
  } catch (error) {
    console.error("❌ Customer seed failed:", error);
  }
};


// super admin created 

export const createSuperAdmin = async () => {
  try {
    console.log("\n🔍 Running bootstrap seed...\n");

    const superAdminEmail = process.env.SUPER_ADMIN_EMAIL!;
    const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD!;

    let superAdmin = await prisma.user.findUnique({
      where: { email: superAdminEmail },
    });

    if (!superAdmin) {
      superAdmin = await prisma.user.create({
        data: {
          name: "Super Admin",
          email: superAdminEmail,
          password: await hashPassword(superAdminPassword),
          role: "SUPER_ADMIN",
          isEmailVerified: true,
        },
      });
      console.log("✅ Super Admin created");
    } else {
      console.log("⚠️ Super Admin already exists");
    }



    // =========================
    // 🟢 VENDOR 1
    // =========================
    const vendor1Email = process.env.VENDOR_ONE_EMAIL!;
    const vendor1Password = process.env.VENDOR_ONE_PASSWORD!;

    let vendor1 = await prisma.user.findUnique({
      where: { email: vendor1Email },
    });

    if (!vendor1) {
      vendor1 = await prisma.user.create({
        data: {
          name: process.env.VENDOR_ONE_NAME!,
          email: vendor1Email,
          password: await hashPassword(vendor1Password),
          role: "VENDOR",
          isEmailVerified: true,
        },
      });
      console.log("✅ Vendor 1 created");
    } else {
      console.log("⚠️ Vendor 1 already exists");
    }

    // Store 1
    const store1Name = "TechZone Store";
    const existingStore1 = await prisma.store.findFirst({
      where: { ownerId: vendor1.id },
    });

    if (!existingStore1) {
      await prisma.store.create({
        data: {
          name: store1Name,
          slug: generateSlug(store1Name),
          ownerId: vendor1.id,
        },
      });
      console.log("✅ Store 1 created");
    }

    // =========================
    // 🟢 VENDOR 2
    // =========================
    const vendor2Email = process.env.VENDOR_TWO_EMAIL!;
    const vendor2Password = process.env.VENDOR_TWO_PASSWORD!;

    let vendor2 = await prisma.user.findUnique({
      where: { email: vendor2Email },
    });

    if (!vendor2) {
      vendor2 = await prisma.user.create({
        data: {
          name: process.env.VENDOR_TWO_NAME!,
          email: vendor2Email,
          password: await hashPassword(vendor2Password),
          role: "VENDOR",
          isEmailVerified: true,
        },
      });
      console.log("✅ Vendor 2 created");
    } else {
      console.log("⚠️ Vendor 2 already exists");
    }

    // Store 2
    const store2Name = "GadgetHub Store";
    const existingStore2 = await prisma.store.findFirst({
      where: { ownerId: vendor2.id },
    });

    if (!existingStore2) {
      await prisma.store.create({
        data: {
          name: store2Name,
          slug: generateSlug(store2Name),
          ownerId: vendor2.id,
        },
      });
      console.log("✅ Store 2 created");
    }

    // =========================
    // 🟢 CATEGORIES
    // =========================
    const categories = [
      "Electronics",
      "Mobile Phones",
      "Laptops",
      "Accessories",
      "Audio",
      "Cameras",
    ];

    for (const name of categories) {
      const slug = generateSlug(name);

      const existing = await prisma.category.findUnique({
        where: { slug },
      });

      if (!existing) {
        await prisma.category.create({
          data: { name, slug },
        });
        console.log(`✅ Category created → ${name}`);
      }
    }

  } catch (error) {
    console.error("❌ Seed failed:", error);
  }
};