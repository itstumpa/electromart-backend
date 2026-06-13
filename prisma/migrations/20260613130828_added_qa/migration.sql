-- CreateEnum
CREATE TYPE "QStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "ProductQuestion" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedBy" TEXT,
ADD COLUMN     "status" "QStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "ProductQuestion_status_idx" ON "ProductQuestion"("status");
