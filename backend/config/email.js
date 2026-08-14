const nodemailer = require('nodemailer');

let transporter = null;

/**
 * Lazily creates a single SMTP transporter. Works with any SMTP provider
 * (SendGrid, Postmark, AWS SES, Gmail SMTP, Mailgun, etc.) — just set the
 * SMTP_* env vars. If they are not configured, emails are logged instead of
 * sent, so local development never crashes on a missing provider.
 */
function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

module.exports = { getTransporter };
