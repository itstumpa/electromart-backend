/*
  Warnings:

  - The `minPayout` column on the `Store` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[cartId,productId,variantId]` on the table `CartItem` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CartItem_cartId_productId_key";

-- AlterTable
ALTER TABLE "OrderAddress" ALTER COLUMN "state" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Store" DROP COLUMN "minPayout",
ADD COLUMN     "minPayout" DECIMAL(65,30) NOT NULL DEFAULT 100;

-- CreateIndex
CREATE UNIQUE INDEX "CartItem_cartId_productId_variantId_key" ON "CartItem"("cartId", "productId", "variantId");

-- XOR CHECK constraints: ensure exactly one of userId or guestId is non-null
ALTER TABLE "Cart" ADD CONSTRAINT "cart_owner_check" CHECK (
  ("userId" IS NOT NULL AND "guestId" IS NULL) OR
  ("userId" IS NULL AND "guestId" IS NOT NULL)
);

ALTER TABLE "Wishlist" ADD CONSTRAINT "wishlist_owner_check" CHECK (
  ("userId" IS NOT NULL AND "guestId" IS NULL) OR
  ("userId" IS NULL AND "guestId" IS NOT NULL)
);

ALTER TABLE "Order" ADD CONSTRAINT "order_owner_check" CHECK (
  ("userId" IS NOT NULL AND "guestId" IS NULL) OR
  ("userId" IS NULL AND "guestId" IS NOT NULL)
);
