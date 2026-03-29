import nodemailer from "nodemailer";

function getTransport() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.EMAIL_FROM ?? "noreply@localhost";
  const transport = getTransport();
  const subject = "Reset your password — UI Code Generator Pro";

  if (!transport) {
    if (process.env.NODE_ENV === "development") {
      console.info("[password-reset] SMTP not configured. Reset link:", resetUrl);
    }
    return { sent: false as const, devLogged: process.env.NODE_ENV === "development" };
  }

  await transport.sendMail({
    from,
    to,
    subject,
    text: `Reset your password by visiting:\n${resetUrl}\n\nThis link expires in 1 hour.`,
    html: `<p>Reset your password:</p><p><a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
  });
  return { sent: true as const };
}
