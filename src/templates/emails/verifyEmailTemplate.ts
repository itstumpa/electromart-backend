export const verifyEmailTemplate = (name: string, verifyUrl: string) => {
  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Verify Your Email</title>
    </head>
    <body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:40px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.08);">
              <tr>
                <td style="background:#111827;padding:24px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:28px;">Electromart</h1>
                </td>
              </tr>

              <tr>
                <td style="padding:40px 32px;">
                  <h2 style="margin-top:0;color:#111827;">Verify Your Email Address</h2>

                  <p style="font-size:16px;color:#4b5563;line-height:1.7;">
                    Hello ${name},
                  </p>

                  <p style="font-size:16px;color:#4b5563;line-height:1.7;">
                    Thank you for creating your Electromart account. Please confirm your email address to activate your account and start using our platform.
                  </p>

                  <div style="text-align:center;margin:32px 0;">
                    <a
                      href="${verifyUrl}"
                      style="background:#2563eb;color:#ffffff;text-decoration:none;padding:14px 28px;border-radius:8px;font-size:16px;font-weight:600;display:inline-block;"
                    >
                      Verify Email
                    </a>
                  </div>

                  <p style="font-size:14px;color:#6b7280;line-height:1.7;">
                    This verification link will expire in 24 hours.
                  </p>

                  <p style="font-size:14px;color:#6b7280;line-height:1.7;">
                    If the button above does not work, copy and paste this URL into your browser:
                  </p>

                  <p style="font-size:14px;word-break:break-all;color:#2563eb;">
                    ${verifyUrl}
                  </p>
                </td>
              </tr>

              <tr>
                <td style="padding:24px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
                  <p style="margin:0;font-size:13px;color:#6b7280;">
                    © 2026 Electromart. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
  `;
};
