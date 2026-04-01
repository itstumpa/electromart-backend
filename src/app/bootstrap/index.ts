// import { ensureSuperAdmin } from "./ensureSuperAdmin";

import { prisma } from "../../lib/prisma";
import { createSuperAdmin } from "./createSuperAdmin";

export async function bootstrapApp() {
  await prisma.$connect();
  console.log("✅ Database connected");

   // 🔥 AUTO SEED HERE
    await createSuperAdmin();
}