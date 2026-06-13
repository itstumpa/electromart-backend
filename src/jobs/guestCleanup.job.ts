// src/jobs/guestCleanup.job.ts
import cron from 'node-cron';
import { prisma } from '../lib/prisma';

/**
 * Cron job that runs every hour to clean up guest carts and wishlists
 * that haven't been updated in 48 hours.
 */
export const startGuestCleanupJob = () => {
  cron.schedule('0 * * * *', async () => {
    console.log('🧹 [CRON] Running guest cleanup...');

    const expiryDate = new Date(Date.now() - 48 * 60 * 60 * 1000);

    try {
      // Delete stale guest carts
      const deletedCarts = await prisma.cart.deleteMany({
        where: {
          guestId: { not: null },
          updatedAt: { lt: expiryDate },
        },
      });

      // Delete stale guest wishlists
      const deletedWishlists = await prisma.wishlist.deleteMany({
        where: {
          guestId: { not: null },
          updatedAt: { lt: expiryDate },
        },
      });

      if (deletedCarts.count > 0 || deletedWishlists.count > 0) {
        console.log(
          `🧹 Guest cleanup complete: ${deletedCarts.count} cart(s), ${deletedWishlists.count} wishlist(s) deleted`,
        );
      }
    } catch (error) {
      console.error('🧹 Guest cleanup job failed:', error);
    }
  });

  console.log('🧹 Guest cleanup cron job scheduled (every hour)');
};
