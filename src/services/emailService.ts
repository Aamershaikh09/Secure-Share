import crypto from 'crypto';
import dotenv from 'dotenv';
import { Resend } from 'resend';

dotenv.config();

export interface VerificationTokenPair {
  rawToken: string;
  tokenHash: string;
}

/**
 * Generates a cryptographically secure 256-bit verification token and its SHA-256 hash.
 * Only the hash is stored in PostgreSQL; the raw token is delivered via email.
 */
export function generateVerificationTokenPair(): VerificationTokenPair {
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto
    .createHash('sha256')
    .update(rawToken)
    .digest('hex');

  return { rawToken, tokenHash };
}

/**
 * Hashes a user-provided raw verification token using SHA-256 for database lookup.
 */
export function hashVerificationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Sends a cryptographic verification email using Resend's HTTPS API.
 */
export async function sendVerificationEmail(
  toEmail: string,
  recipientName: string,
  rawToken: string
): Promise<{ sent: boolean; reason?: string }> {
  const baseUrl = (
    process.env.APP_BASE_URL || 'http://localhost:3000'
  ).replace(/\/+$/, '');

  const verificationUrl = `${baseUrl}/verify-email?token=${encodeURIComponent(
    rawToken
  )}`;

  const resendApiKey = process.env.RESEND_API_KEY;

  if (!resendApiKey) {
    console.warn(
      '[EMAIL SERVICE ADVISORY] RESEND_API_KEY is not configured. Verification email was not sent.'
    );

    return {
      sent: false,
      reason:
        'RESEND_API_KEY is not configured. Add RESEND_API_KEY to the environment variables.',
    };
  }

  const resend = new Resend(resendApiKey);

  /*
   * IMPORTANT:
   *
   * If you have not verified your own domain with Resend yet,
   * use:
   *
   *   onboarding@resend.dev
   *
   * as the sender.
   *
   * Once you verify your own domain in Resend, change this to:
   *
   *   SecureShare <no-reply@yourdomain.com>
   */
  const fromAddress =
    process.env.RESEND_FROM_EMAIL || 'SecureShare <onboarding@resend.dev>';

  const subject = 'Verify your SecureShare account';

  const textBody = `
Hello ${recipientName},

Thank you for creating an account with SecureShare.

To activate your SecureShare account and begin securely uploading and sharing files, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours.

If you did not create an account on SecureShare, you can safely ignore this email.

---

SecureShare Controlled File Sharing

`;

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Verify your SecureShare account</title>
</head>

<body style="margin: 0; padding: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b;">

  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">

    <!-- Header -->
    <tr>
      <td style="padding: 32px 32px 20px 32px; background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);">

        <table border="0" cellspacing="0" cellpadding="0">
          <tr>

            <td style="background-color: rgba(255,255,255,0.2); border-radius: 10px; width: 40px; height: 40px; text-align: center; vertical-align: middle;">
              <span style="font-size: 20px; line-height: 40px;">🛡️</span>
            </td>

            <td style="padding-left: 14px;">
              <h1 style="margin: 0; color: #ffffff; font-size: 20px; font-weight: 700; letter-spacing: -0.5px;">
                SecureShare
              </h1>

              <p style="margin: 2px 0 0 0; color: #bfdbfe; font-size: 12px; font-weight: 500;">
                Secure File Storage & Sharing
              </p>
            </td>

          </tr>
        </table>

      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 32px;">

        <h2 style="margin: 0 0 16px 0; color: #0f172a; font-size: 18px; font-weight: 600;">
          Verify your email address
        </h2>

        <p style="margin: 0 0 16px 0; color: #475569; font-size: 14px; line-height: 1.6;">
          Hello <strong>${recipientName}</strong>,
        </p>

        <p style="margin: 0 0 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
          Thank you for creating an account with <strong>SecureShare</strong>.
          To activate your personal vault and access secure file storage,
          please verify your email address by clicking the button below:
        </p>

        <!-- CTA Button -->
        <table border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
          <tr>
            <td align="center" style="border-radius: 12px; background-color: #2563eb;">

              <a
                href="${verificationUrl}"
                target="_blank"
                style="display: inline-block; padding: 14px 28px; font-size: 14px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 12px;"
              >
                Verify Email Address →
              </a>

            </td>
          </tr>
        </table>

        <!-- Expiry note -->
        <div style="background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 24px;">

          <p style="margin: 0; font-size: 12px; color: #334155; line-height: 1.5;">
            <strong>Expiry Information:</strong>
            This verification link expires in <strong>24 hours</strong>.
            If it expires, you can request a new one at the login screen.
          </p>

        </div>

        <!-- Plain link fallback -->
        <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; line-height: 1.5;">
          If the button above does not work, copy and paste this URL into your browser:
        </p>

        <p style="margin: 0 0 24px 0; font-family: monospace; font-size: 11px; word-break: break-all; color: #2563eb; background-color: #f8fafc; padding: 10px; border-radius: 8px; border: 1px solid #e2e8f0;">
          ${verificationUrl}
        </p>

        <!-- Security Note -->
        <p style="margin: 24px 0 0 0; border-top: 1px solid #f1f5f9; padding-top: 16px; color: #94a3b8; font-size: 12px; line-height: 1.5;">
          <strong>Security Notice:</strong>
          If you did not register for an account with SecureShare,
          you can safely ignore this email. No further action is required.
        </p>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding: 20px 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">

        <p style="margin: 0; color: #94a3b8; font-size: 11px;">
          SecureShare Controlled File Sharing · BSc Computer Science Semester 5
        </p>

      </td>
    </tr>

  </table>

</body>
</html>
`;

  try {
    const { data, error } = await resend.emails.send({
      from: fromAddress,
      to: [toEmail],
      subject,
      text: textBody,
      html: htmlBody,
    });

    if (error) {
      console.error(
        `[EMAIL SERVICE ERROR] Resend failed to deliver email to ${toEmail}:`,
        error
      );

      return {
        sent: false,
        reason: error.message || 'Resend email delivery failed.',
      };
    }

    console.log(
      `[EMAIL SERVICE] Verification email successfully dispatched to ${toEmail} (messageId: ${data?.id || 'unknown'})`
    );

    if (process.env.NODE_ENV !== 'production') {
      console.log(
        `[EMAIL SERVICE] Development verification URL: ${verificationUrl}`
      );
    }

    return { sent: true };
  } catch (err: any) {
    console.error(
      `[EMAIL SERVICE ERROR] Failed to deliver email to ${toEmail}:`,
      err?.message || err
    );

    return {
      sent: false,
      reason: err?.message || 'Unknown email delivery error.',
    };
  }
}