import dotenv from "dotenv";
import path from "path";

// Load .env
dotenv.config({ path: path.join(process.cwd(), ".env") });

// Ensure required env variables exist
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing in .env");
}
if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error("JWT_ACCESS_SECRET is missing in .env");
}
if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("JWT_REFRESH_SECRET is missing in .env");
}
if (!process.env.STRIPE_WEBHOOK_SECRET) {
  throw new Error("STRIPE_WEBHOOK_SECRET is missing in .env");
}

const config = {
  node_env: process.env.NODE_ENV || "development",
  app_name: process.env.APP_NAME || "ElectroMart",
  port: process.env.PORT ? Number(process.env.PORT) : 3000,
  database_url: process.env.DATABASE_URL || "",
  frontend_url: process.env.FRONTEND_URL || "",
  backend_url: process.env.BACKEND_URL || "",
  client_url: process.env.CLIENT_URL || "",


  accessSecret: process.env.JWT_ACCESS_SECRET!,
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  accessExpires: process.env.JWT_ACCESS_EXPIRES || "15m",
  refreshExpires: process.env.JWT_REFRESH_EXPIRES || "7d",


  api_key: process.env.CLOUDINARY_API_KEY,
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_secret: process.env.CLOUDINARY_API_SECRET,

};

export default config;