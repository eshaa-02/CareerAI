/**
 * Shared HTML email shell + template builders for all interview lifecycle
 * emails. Kept dependency-free (no template engine) so it works identically
 * in any Node environment.
 */

const BRAND_COLOR = '#059669';
const BRAND_DARK = '#05070d';

function shell({ title, preheader = '', bodyHtml, ctaLabel, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f7f3;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <span style="display:none;font-size:1px;color:#f4f7f3;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7f3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">
          <tr>
            <td style="background:linear-gradient(135deg, ${BRAND_DARK}, #0d1526);padding:28px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="display:inline-block;width:32px;height:32px;border-radius:8px;background:linear-gradient(135deg,#34d399,${BRAND_COLOR});vertical-align:middle;"></span>
                    <span style="color:#ffffff;font-size:18px;font-weight:700;vertical-align:middle;margin-left:10px;">CareerAI</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px;">
              <h1 style="margin:0 0 16px;font-size:22px;color:#1f2937;">${title}</h1>
              <div style="font-size:15px;line-height:1.6;color:#4b5563;">${bodyHtml}</div>
              ${
                ctaLabel && ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:28px;">
                      <tr>
                        <td style="border-radius:10px;background:linear-gradient(135deg,#b8874a,#9c6f3b);">
                          <a href="${ctaUrl}" style="display:inline-block;padding:13px 28px;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;">${ctaLabel}</a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #eef0f2;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                CareerAI · This is an automated message regarding your job application activity.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function detailsTable(rows) {
  return `<table role="presentation" width="100%" style="margin:20px 0;border-collapse:collapse;">
    ${rows
      .map(
        ([label, value]) => `<tr>
          <td style="padding:8px 0;font-size:13px;color:#9ca3af;width:35%;">${label}</td>
          <td style="padding:8px 0;font-size:14px;color:#1f2937;font-weight:600;">${value}</td>
        </tr>`
      )
      .join('')}
  </table>`;
}

const templates = {
  interviewInvitation: (data) =>
    shell({
      title: `Interview Invitation: ${data.jobTitle}`,
      preheader: `You're invited to interview for ${data.jobTitle} at ${data.companyName}`,
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>Great news — <strong>${data.companyName}</strong> would like to interview you for the <strong>${data.jobTitle}</strong> position.</p>
        ${detailsTable([
          ['Round', data.round],
          ['Type', data.interviewType],
          ['Date', data.date],
          ['Time', `${data.startTime} - ${data.endTime} (${data.timezone})`],
          ['Location / Link', data.locationOrLink],
        ])}
        ${data.instructions ? `<p><strong>Instructions:</strong> ${data.instructions}</p>` : ''}
        <p>Please confirm your attendance from your CareerAI dashboard.</p>
      `,
      ctaLabel: 'View Interview Details',
      ctaUrl: data.dashboardUrl,
    }),

  interviewReminder24h: (data) =>
    shell({
      title: `Reminder: Interview Tomorrow for ${data.jobTitle}`,
      preheader: 'Your interview is in 24 hours',
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>This is a friendly reminder that your interview for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> is scheduled for tomorrow.</p>
        ${detailsTable([
          ['Date', data.date],
          ['Time', `${data.startTime} - ${data.endTime} (${data.timezone})`],
          ['Location / Link', data.locationOrLink],
        ])}
        <p>Make sure you're prepared — review the job description and have any requested documents ready.</p>
      `,
      ctaLabel: 'View Interview Details',
      ctaUrl: data.dashboardUrl,
    }),

  interviewReminder1h: (data) =>
    shell({
      title: `Starting Soon: ${data.jobTitle} Interview`,
      preheader: 'Your interview starts in 1 hour',
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>Your interview for <strong>${data.jobTitle}</strong> starts in about an hour.</p>
        ${detailsTable([
          ['Time', `${data.startTime} (${data.timezone})`],
          ['Location / Link', data.locationOrLink],
        ])}
        <p>Good luck!</p>
      `,
      ctaLabel: 'Join Interview',
      ctaUrl: data.meetingLink || data.dashboardUrl,
    }),

  interviewRescheduled: (data) =>
    shell({
      title: `Interview Rescheduled: ${data.jobTitle}`,
      preheader: 'Your interview time has changed',
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>Your interview for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been rescheduled.</p>
        ${detailsTable([
          ['New Date', data.date],
          ['New Time', `${data.startTime} - ${data.endTime} (${data.timezone})`],
        ])}
      `,
      ctaLabel: 'View Updated Details',
      ctaUrl: data.dashboardUrl,
    }),

  interviewCancelled: (data) =>
    shell({
      title: `Interview Cancelled: ${data.jobTitle}`,
      preheader: 'Your interview has been cancelled',
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>Your interview for <strong>${data.jobTitle}</strong> at <strong>${data.companyName}</strong> has been cancelled.</p>
        ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
        <p>You can view the rest of your applications from your dashboard.</p>
      `,
      ctaLabel: 'Go to Dashboard',
      ctaUrl: data.dashboardUrl,
    }),

  interviewResultSelected: (data) =>
    shell({
      title: `Congratulations, ${data.candidateName}!`,
      preheader: `You've been selected for ${data.jobTitle}`,
      bodyHtml: `
        <p>We're thrilled to let you know that <strong>${data.companyName}</strong> has selected you for the <strong>${data.jobTitle}</strong> position after your interview.</p>
        <p>The employer will be in touch with next steps shortly.</p>
      `,
      ctaLabel: 'View Details',
      ctaUrl: data.dashboardUrl,
    }),

  interviewResultRejected: (data) =>
    shell({
      title: `Update on your ${data.jobTitle} application`,
      preheader: 'Interview outcome update',
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>Thank you for interviewing for the <strong>${data.jobTitle}</strong> position at <strong>${data.companyName}</strong>. After careful consideration, the team has decided to move forward with other candidates at this time.</p>
        <p>We encourage you to keep exploring roles that match your profile on CareerAI.</p>
      `,
      ctaLabel: 'Browse More Jobs',
      ctaUrl: data.jobsUrl,
    }),

  interviewNextRound: (data) =>
    shell({
      title: `You're moving to the next round!`,
      preheader: `Next round for ${data.jobTitle}`,
      bodyHtml: `
        <p>Hi ${data.candidateName},</p>
        <p>Great news — <strong>${data.companyName}</strong> would like to move you forward to the next round for <strong>${data.jobTitle}</strong>.</p>
        <p>You'll receive a new interview invitation shortly with the details.</p>
      `,
      ctaLabel: 'View Application',
      ctaUrl: data.dashboardUrl,
    }),

  passwordReset: (data) =>
    shell({
      title: 'Reset your password',
      preheader: 'A password reset was requested for your CareerAI account',
      bodyHtml: `
        <p>Hi ${data.name},</p>
        <p>We received a request to reset the password for your CareerAI account. If you made this request, click the button below to choose a new password. This link expires in 10 minutes.</p>
        <p>If you didn't request this, you can safely ignore this email — your password will not be changed.</p>
      `,
      ctaLabel: 'Reset Password',
      ctaUrl: data.resetUrl,
    }),
};

module.exports = { templates };
