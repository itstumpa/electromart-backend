/*
  Warnings:

  - You are about to drop the `VendorProfile` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "badge" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "coverImage" TEXT,
ADD COLUMN     "isApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offers" TEXT,
ADD COLUMN     "specialty" TEXT;

-- DropTable
DROP TABLE "VendorProfile";
