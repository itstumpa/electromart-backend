/*
  Warnings:

  - A unique constraint covering the columns `[guestId]` on the table `Cart` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[guestId]` on the table `Wishlist` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Cart" ADD COLUMN     "guestId" TEXT;

-- AlterTable
ALTER TABLE "Wishlist" ADD COLUMN     "guestId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Cart_guestId_key" ON "Cart"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "Wishlist_guestId_key" ON "Wishlist"("guestId");
