const { getTransporter } = require('../config/email');
const { templates } = require('../utils/emailTemplates');

/**
 * Sends an email using one of the named templates. If no SMTP provider is
 * configured (local dev), the email is logged instead of sent so the rest
 * of the interview workflow (DB writes, socket events) is never blocked by
 * missing email credentials.
 */
async function sendTemplateEmail(templateName, to, data) {
  const builder = templates[templateName];
  if (!builder) {
    console.warn(`Unknown email template: ${templateName}`);
    return { sent: false, reason: 'unknown_template' };
  }

  const html = builder(data);
  const subjectMap = {
    interviewInvitation: `Interview Invitation — ${data.jobTitle} at ${data.companyName}`,
    interviewReminder24h: `Reminder: Interview Tomorrow — ${data.jobTitle}`,
    interviewReminder1h: `Starting Soon: ${data.jobTitle} Interview`,
    interviewRescheduled: `Interview Rescheduled — ${data.jobTitle}`,
    interviewCancelled: `Interview Cancelled — ${data.jobTitle}`,
    interviewResultSelected: `Congratulations — ${data.jobTitle}`,
    interviewResultRejected: `Update on your ${data.jobTitle} application`,
    interviewNextRound: `Next Round — ${data.jobTitle}`,
    passwordReset: 'Reset your CareerAI password',
  };

  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[email:dev-mode] Would send "${templateName}" to ${to}: ${subjectMap[templateName]}`);
    return { sent: false, reason: 'smtp_not_configured' };
  }

  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'CareerAI'}" <${process.env.EMAIL_FROM_ADDRESS || 'notifications@careerai.com'}>`,
      to,
      subject: subjectMap[templateName] || 'CareerAI Notification',
      html,
    });
    return { sent: true };
  } catch (err) {
    console.error(`Failed to send email (${templateName}) to ${to}:`, err.message);
    return { sent: false, reason: err.message };
  }
}

module.exports = { sendTemplateEmail };
