// src/utils/envValidator.ts
const REQUIRED_ENV = [
  "DATABASE_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "REDIS_URL",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "SMTP_HOST",
  "SMTP_USER",
  "SMTP_PASS",
  "VAPID_PUBLIC_KEY",
  "VAPID_PRIVATE_KEY",
  "VAPID_EMAIL",
  "SESSION_SECRET",
  "CLIENT_URL",
];

export const validateEnv = () => {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error("❌ Missing required environment variables:");
    missing.forEach((key) => console.error(`   - ${key}`));
    process.exit(1);
  }

  console.log("✅ Environment variables validated");
};