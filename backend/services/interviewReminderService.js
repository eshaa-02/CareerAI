const cron = require('node-cron');
const Interview = require('../models/Interview');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const { sendNotification } = require('./notificationService');
const { sendTemplateEmail } = require('./emailService');

function combineDateAndTime(date, timeStr) {
  const d = new Date(date);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  d.setHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

async function processReminders() {
  const now = new Date();
  const activeStatuses = ['scheduled', 'invitation_sent', 'accepted', 'rescheduled', 'reminder_sent'];

  const upcoming = await Interview.find({
    status: { $in: activeStatuses },
    date: { $gte: now, $lte: new Date(now.getTime() + 25 * 60 * 60 * 1000) },
  })
    .populate('candidateId', 'name email')
    .populate('jobId', 'title')
    .populate('companyId', 'name');

  for (const interview of upcoming) {
    const startDateTime = combineDateAndTime(interview.date, interview.startTime);
    const hoursUntil = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const context = {
      candidateName: interview.candidateId.name,
      jobTitle: interview.jobId.title,
      companyName: interview.companyId.name,
      date: new Date(interview.date).toDateString(),
      startTime: interview.startTime,
      endTime: interview.endTime,
      timezone: interview.timezone,
      locationOrLink: interview.meetingLink || interview.location || 'To be confirmed',
      meetingLink: interview.meetingLink,
      dashboardUrl: `${process.env.CLIENT_URL}/dashboard/candidate/interviews`,
    };

    if (hoursUntil <= 24 && hoursUntil > 23 && !interview.remindersSent.hour24) {
      await sendNotification({
        userId: interview.candidateId._id,
        type: 'interview_reminder',
        title: 'Interview tomorrow',
        message: `Your interview for ${interview.jobId.title} is in 24 hours`,
        link: '/dashboard/candidate/interviews',
        relatedId: interview._id,
      });
      await sendTemplateEmail('interviewReminder24h', interview.candidateId.email, context);
      interview.remindersSent.hour24 = true;
      interview.status = 'reminder_sent';
      await interview.save();
    }

    if (hoursUntil <= 1 && hoursUntil > 0.9 && !interview.remindersSent.hour1) {
      await sendNotification({
        userId: interview.candidateId._id,
        type: 'interview_reminder',
        title: 'Interview starting soon',
        message: `Your interview for ${interview.jobId.title} starts in 1 hour`,
        link: '/dashboard/candidate/interviews',
        relatedId: interview._id,
      });
      await sendTemplateEmail('interviewReminder1h', interview.candidateId.email, context);
      interview.remindersSent.hour1 = true;
      await interview.save();
    }
  }
}

// Runs every 5 minutes. In production this is a reasonable granularity for
// interview reminders; adjust the cron expression if tighter timing is needed.
function startReminderCron() {
  cron.schedule('*/5 * * * *', () => {
    processReminders().catch((err) => console.error('Interview reminder cron error:', err.message));
  });
  console.log('Interview reminder cron scheduled (every 5 minutes)');
}

module.exports = { startReminderCron, processReminders };
