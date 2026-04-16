// src/utils/emailTemplates.ts

export const orderConfirmedEmail = (
  customerName: string,
  orderId: string,
  totalAmount: number,
  items: { name: string; quantity: number; price: number }[]
) => ({
  subject: "✅ Order Confirmed — ElectroMart",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a1a2e;">Hi ${customerName}, your order is confirmed!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <table width="100%" cellpadding="8" style="border-collapse: collapse;">
        <thead>
          <tr style="background: #f4f4f4;">
            <th align="left">Product</th>
            <th align="left">Qty</th>
            <th align="left">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items
            .map(
              (item) => `
            <tr>
              <td>${item.name}</td>
              <td>${item.quantity}</td>
              <td>$${item.price}</td>
            </tr>`
            )
            .join("")}
        </tbody>
      </table>
      <h3>Total: $${totalAmount}</h3>
      <p>We'll notify you when your order ships. Thank you for shopping with ElectroMart!</p>
    </div>
  `,
});

export const newOrderVendorEmail = (
  vendorName: string,
  storeName: string,
  orderId: string,
  items: { name: string; quantity: number }[]
) => ({
  subject: "🛒 New Order Received — ElectroMart",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a1a2e;">Hi ${vendorName}, you have a new order!</h2>
      <p>Store: <strong>${storeName}</strong></p>
      <p>Order ID: <strong>${orderId}</strong></p>
      <ul>
        ${items.map((i) => `<li>${i.name} × ${i.quantity}</li>`).join("")}
      </ul>
      <p>Log in to your vendor dashboard to process this order.</p>
    </div>
  `,
});

export const orderStatusUpdateEmail = (
  customerName: string,
  orderId: string,
  status: string
) => ({
  subject: `📦 Order Update: ${status} — ElectroMart`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a1a2e;">Hi ${customerName}, your order has been updated!</h2>
      <p>Order ID: <strong>${orderId}</strong></p>
      <p>New Status: <strong style="color: #e94560;">${status}</strong></p>
      <p>Log in to ElectroMart to track your order.</p>
    </div>
  `,
});

export const returnRequestedEmail = (
  vendorName: string,
  productName: string,
  reason: string
) => ({
  subject: "🔁 Return Request Received — ElectroMart",
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto;">
      <h2 style="color: #1a1a2e;">Hi ${vendorName}, a return has been requested.</h2>
      <p>Product: <strong>${productName}</strong></p>
      <p>Reason: <em>${reason}</em></p>
      <p>Log in to your vendor dashboard to approve or reject this request.</p>
    </div>
  `,
});