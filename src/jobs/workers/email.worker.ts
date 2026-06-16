// src/jobs/workers/email.worker.ts
import { Job, Worker } from 'bullmq';
import {
  newOrderVendorEmail,
  orderConfirmedEmail,
  orderStatusUpdateEmail,
  returnRequestedEmail,
} from '../../utils/emailTemplates';
import logger from '../../utils/logger';
import { sendEmail } from '../../utils/sendEmail';
import { EmailJobData } from '../queues/email.queue';

import { getBullConnection } from '../../app/config/redis';

const processEmailJob = async (job: Job<EmailJobData>) => {
  const data = job.data;
  logger.info(`📧 Processing email job: ${data.type} → ${data.to}`);

  switch (data.type) {
    case 'ORDER_CONFIRMED': {
      const tmpl = orderConfirmedEmail(data.customerName, data.orderId, data.totalAmount, data.items);
      await sendEmail({ to: data.to, ...tmpl });
      break;
    }
    case 'NEW_ORDER_VENDOR': {
      const tmpl = newOrderVendorEmail(data.vendorName, data.storeName, data.orderId, data.items);
      await sendEmail({ to: data.to, ...tmpl });
      break;
    }
    case 'ORDER_STATUS': {
      const tmpl = orderStatusUpdateEmail(data.customerName, data.orderId, data.status);
      await sendEmail({ to: data.to, ...tmpl });
      break;
    }
    case 'RETURN_REQUESTED': {
      const tmpl = returnRequestedEmail(data.vendorName, data.productName, data.reason);
      await sendEmail({ to: data.to, ...tmpl });
      break;
    }
    case 'RETURN_RESOLVED':
      await sendEmail({
        to: data.to,
        subject: `Return Request ${data.status} — Electromart`,
        html: `<p>Hi ${data.customerName}, your return for <strong>${data.productName}</strong> was <strong>${data.status}</strong>. ${data.note ? `Vendor note: ${data.note}` : ''}</p>`,
      });
      break;
    case 'STOCK_ALERT':
      await sendEmail({
        to: data.to,
        subject: `✅ "${data.productName}" is Back In Stock — Electromart`,
        html: `<p>Hi ${data.customerName}, <strong>${data.productName}</strong> is back in stock at <strong>$${data.price}</strong>. Order now!</p>`,
      });
      break;
    case 'QA_QUESTION':
      await sendEmail({
        to: data.to,
        subject: '❓ New Question on Your Product — Electromart',
        html: `<p>Hi ${data.vendorName}, a customer asked about <strong>${data.productName}</strong>:<br><blockquote>${data.question}</blockquote></p>`,
      });
      break;
    case 'QA_ANSWER':
      await sendEmail({
        to: data.to,
        subject: '✅ Your Question Was Answered — Electromart',
        html: `<p>Hi ${data.customerName}, your question about <strong>${data.productName}</strong>:<br><blockquote>${data.question}</blockquote><strong>Answer:</strong> ${data.answer}</p>`,
      });
      break;
    case 'PAYMENT_CONFIRMED':
      await sendEmail({
        to: data.to,
        subject: '✅ Payment Confirmed — Electromart',
        html: `<p>Hi ${data.customerName}, your payment of <strong>$${data.amount}</strong> for order <strong>#${data.orderId.slice(-6).toUpperCase()}</strong> was successful. Tx ID: <code>${data.transactionId}</code></p>`,
      });
      break;
    case 'REFUND_PROCESSED':
      await sendEmail({
        to: data.to,
        subject: '💰 Refund Processed — Electromart',
        html: `<p>Hi ${data.customerName}, your refund of <strong>${data.amount} ${data.currency}</strong> for order <strong>#${data.orderId.slice(-6).toUpperCase()}</strong> was processed. Refund ID: <code>${data.refundId}</code></p>`,
      });
      break;
    case 'VERIFY_EMAIL':
      await sendEmail({
        to: data.to,
        subject: 'Verify your Electromart account',
        html: `<p>Hi ${data.name}, click to verify: <a href="${data.verifyUrl}">${data.verifyUrl}</a>. Expires in 24 hours.</p>`,
      });
      break;
    case 'RESET_PASSWORD':
      await sendEmail({
        to: data.to,
        subject: 'Electromart Password Reset Code',
        html: `<p>Your reset code: <strong>${data.resetToken}</strong>. Expires in 15 minutes.</p>`,
      });
      break;
    case 'WEEKLY_DIGEST': {
      const rows = (items: any[]) => items.map((p) => `<tr><td>${p?.name}</td><td>$${p?.price}</td></tr>`).join('');
      await sendEmail({
        to: data.to,
        subject: '🛍️ This Week on Electromart',
        html: `
          <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto">
            <h2>Hi ${data.customerName}!</h2>
            <h3>🔥 Top Selling</h3>
            <table width="100%"><tbody>${rows(data.topProducts)}</tbody></table>
            <h3>🆕 New Arrivals</h3>
            <table width="100%"><tbody>${rows(data.newProducts)}</tbody></table>
          </div>
        `,
      });
      break;
    }
    default:
      logger.warn(`Unknown email job type`);
  }

  logger.info(`✅ Email sent: ${data.type} → ${data.to}`);
};

export const startEmailWorker = () => {
  const worker = new Worker<EmailJobData>('email', processEmailJob, {
    connection: getBullConnection(),
    concurrency: 5,
  });

  worker.on('completed', (job) => logger.info(`✅ Email job ${job.id} completed`));
  worker.on('failed', (job, err) => logger.error(`❌ Email job ${job?.id} failed: ${err.message}`));

  logger.info('✅ Email worker started');
  return worker;
};
