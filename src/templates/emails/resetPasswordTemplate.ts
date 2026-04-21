export const resetPasswordTemplate = (
  name: string,
  resetCode: string,
) => {
  return `
  <div style="font-family:Arial,sans-serif;padding:30px;background:#f4f4f7;">
    <div style="max-width:600px;margin:0 auto;background:#fff;padding:40px;border-radius:12px;">
      <h2 style="color:#111827;">Password Reset Request</h2>
      <p>Hello ${name},</p>
      <p>We received a request to reset your password.</p>
      <p>Your reset code is:</p>
      <div style="font-size:32px;font-weight:bold;letter-spacing:6px;color:#2563eb;margin:20px 0;">
        ${resetCode}
      </div>
      <p>This code will expire in 15 minutes.</p>
    </div>
  </div>
  `;
};