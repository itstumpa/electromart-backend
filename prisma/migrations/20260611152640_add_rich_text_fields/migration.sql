/*
  Warnings:

  - The `details` column on the `Product` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "additionalInfo" JSONB,
ADD COLUMN     "highlights" JSONB,
ADD COLUMN     "overview" JSONB,
DROP COLUMN "details",
ADD COLUMN     "details" JSONB;
