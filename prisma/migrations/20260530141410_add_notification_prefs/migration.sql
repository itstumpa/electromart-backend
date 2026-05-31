-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notifDeliveryAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifOrderUpdates" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifPromotions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "notifReviewReminder" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifWeeklyDigest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "notifWishlistSale" BOOLEAN NOT NULL DEFAULT true;
