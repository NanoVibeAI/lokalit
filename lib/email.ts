import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT ?? 587),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function sendVerificationEmail(email: string, token: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const verifyUrl = `${baseUrl}/api/auth/verify?token=${token}`;

  // In development without SMTP configured, print to console instead
  if (process.env.NODE_ENV !== "production" && !process.env.EMAIL_HOST) {
    console.log(`\n[DEV] Verification link for ${email}:\n${verifyUrl}\n`);
    return;
  }

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? "noreply@l10n.app",
    to: email,
    subject: "Verify your L10n account",
    html: `
      <p>Hi,</p>
      <p>Thanks for signing up for <strong>L10n</strong>!</p>
      <p>Click the button below to verify your email address. This link expires in 24 hours.</p>
      <p style="margin: 24px 0;">
        <a href="${verifyUrl}" style="background:#18181b;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;font-size:14px;">
          Verify my email
        </a>
      </p>
      <p style="color:#71717a;font-size:12px;">Or paste this URL into your browser:<br>${verifyUrl}</p>
    `,
    text: `Verify your L10n account\n\nClick the link below (expires in 24 hours):\n${verifyUrl}`,
  });
}
