// src/jobs/weeklyDigest.job.ts
import cron from 'node-cron';
import { prisma } from '../lib/prisma';
import { sendEmail } from '../utils/sendEmail';

const sendWeeklyDigest = async () => {
  console.log('📧 [CRON] Sending weekly digest emails...');

  // get top 5 products by recent orders (last 7 days)
  const topProducts = await prisma.orderItem.groupBy({
    by: ['productId'],
    where: {
      createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
    _sum: { quantity: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: 5,
  });

  const products = await Promise.all(
    topProducts.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: {
          id: true,
          name: true,
          price: true,
          images: { take: 1 },
        },
      });
      return { ...product, totalSold: item._sum.quantity };
    })
  );

  // get newest 5 products
  const newProducts = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
    select: {
      id: true,
      name: true,
      price: true,
      images: { take: 1 },
      store: { select: { name: true } },
    },
  });

  // get all customers who have verified emails
  const customers = await prisma.user.findMany({
    where: { role: 'CUSTOMER', isEmailVerified: true },
    select: { name: true, email: true },
  });

  console.log(`📧 Sending digest to ${customers.length} customers...`);

  const productRows = (items: any[]) =>
    items
      .map(
        (p) => `
      <tr>
        <td style="padding:8px;border-bottom:1px solid #eee">${p?.name ?? 'N/A'}</td>
        <td style="padding:8px;border-bottom:1px solid #eee">$${p?.price ?? '-'}</td>
      </tr>`
      )
      .join('');

  // send in batches of 50 to avoid SMTP overload
  const batchSize = 50;
  for (let i = 0; i < customers.length; i += batchSize) {
    const batch = customers.slice(i, i + batchSize);

    await Promise.allSettled(
      batch.map((customer) =>
        sendEmail({
          to: customer.email,
          subject: '🛍️ This Week on Electromart — Top Deals & New Arrivals',
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
              <h2 style="color:#1a1a2e">Hi ${customer.name}, here's what's trending!</h2>

              <h3>🔥 Top Selling This Week</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background:#f4f4f4">
                    <th align="left" style="padding:8px">Product</th>
                    <th align="left" style="padding:8px">Price</th>
                  </tr>
                </thead>
                <tbody>${productRows(products)}</tbody>
              </table>

              <h3>🆕 New Arrivals</h3>
              <table width="100%" cellpadding="0" cellspacing="0">
                <thead>
                  <tr style="background:#f4f4f4">
                    <th align="left" style="padding:8px">Product</th>
                    <th align="left" style="padding:8px">Price</th>
                  </tr>
                </thead>
                <tbody>${productRows(newProducts)}</tbody>
              </table>

              <p style="margin-top:24px;font-size:12px;color:#999">
                You're receiving this because you're a member of Electromart.
              </p>
            </div>
          `,
        })
      )
    );
  }

  console.log('✅ Weekly digest sent!');
};

// every Monday at 9:00 AM
export const startWeeklyDigestJob = () => {
  cron.schedule('0 9 * * 1', async () => {
    console.log('⏰ [CRON] Running weekly digest job...');
    try {
      await sendWeeklyDigest();
    } catch (err) {
      console.error('❌ Weekly digest job failed:', err);
    }
  });

  console.log('✅ Weekly digest cron job scheduled — every Monday 9:00 AM');
};
