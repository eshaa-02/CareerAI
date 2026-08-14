/**
 * Generates an RFC 5545 .ics file for a single interview, so candidates and
 * employers can add it to Google Calendar, Outlook, Apple Calendar, etc.
 * No external dependency — the format is simple enough to build directly.
 */

function formatICSDate(date) {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .split('.')[0] + 'Z';
}

function escapeICSText(text = '') {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function buildInterviewICS(interview, jobTitle, companyName) {
  const startDateTime = combineDateAndTime(interview.date, interview.startTime);
  const endDateTime = combineDateAndTime(interview.date, interview.endTime);

  const uid = `interview-${interview._id}@careerai.com`;
  const summary = `Interview: ${jobTitle} at ${companyName}`;
  const description = [
    `Round: ${interview.interviewRound}`,
    `Type: ${interview.interviewType}`,
    interview.meetingLink ? `Meeting Link: ${interview.meetingLink}` : '',
    interview.instructions ? `Instructions: ${interview.instructions}` : '',
  ]
    .filter(Boolean)
    .join('\\n');

  const location = interview.location || interview.meetingLink || '';

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CareerAI//Interview Scheduler//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${formatICSDate(new Date())}`,
    `DTSTART:${formatICSDate(startDateTime)}`,
    `DTEND:${formatICSDate(endDateTime)}`,
    `SUMMARY:${escapeICSText(summary)}`,
    `DESCRIPTION:${escapeICSText(description)}`,
    `LOCATION:${escapeICSText(location)}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Interview reminder',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  return lines.join('\r\n');
}

function combineDateAndTime(date, timeStr) {
  const d = new Date(date);
  const [hours, minutes] = (timeStr || '00:00').split(':').map(Number);
  d.setUTCHours(hours || 0, minutes || 0, 0, 0);
  return d;
}

module.exports = { buildInterviewICS };
