const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const Interview = require('../models/Interview');
const Application = require('../models/Application');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const { sendNotification } = require('../services/notificationService');
const { sendTemplateEmail } = require('../services/emailService');
const { buildInterviewICS } = require('../utils/icsGenerator');

const populateInterview = (query) =>
  query
    .populate('candidateId', 'name email avatar phone')
    .populate('employerId', 'name email')
    .populate('companyId', 'name logo')
    .populate('jobId', 'title')
    .populate('interviewerIds', 'name email avatar');

async function buildEmailContext(interview) {
  const job = interview.jobId.title ? interview.jobId : await Job.findById(interview.jobId);
  const company = interview.companyId.name ? interview.companyId : await Company.findById(interview.companyId);
  const candidate = interview.candidateId.name ? interview.candidateId : await User.findById(interview.candidateId);

  return {
    candidateName: candidate.name,
    jobTitle: job.title,
    companyName: company.name,
    round: interview.interviewRound,
    interviewType: interview.interviewType,
    date: new Date(interview.date).toDateString(),
    startTime: interview.startTime,
    endTime: interview.endTime,
    timezone: interview.timezone,
    locationOrLink: interview.meetingLink || interview.location || 'To be confirmed',
    meetingLink: interview.meetingLink,
    instructions: interview.instructions,
    dashboardUrl: `${process.env.CLIENT_URL}/dashboard/candidate/interviews`,
    jobsUrl: `${process.env.CLIENT_URL}/jobs`,
  };
}

// @desc    Schedule a new interview for a shortlisted candidate
// @route   POST /api/interviews
// @access  Private (employer)
exports.scheduleInterview = asyncHandler(async (req, res, next) => {
  const {
    applicationId,
    interviewRound,
    interviewType,
    meetingPlatform,
    meetingLink,
    location,
    date,
    startTime,
    endTime,
    durationMinutes,
    timezone,
    instructions,
    agenda,
    interviewerIds,
  } = req.body;

  const application = await Application.findById(applicationId).populate('jobId');
  if (!application) return next(new ErrorResponse('Application not found', 404));
  if (application.employerId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized to schedule for this application', 403));
  }

  const company = await Company.findOne({ ownerId: req.user.id });

  const interview = await Interview.create({
    jobId: application.jobId._id,
    applicationId: application._id,
    candidateId: application.candidateId,
    employerId: req.user.id,
    companyId: company._id,
    interviewerIds: interviewerIds || [req.user.id],
    interviewRound: interviewRound || 'round-1',
    interviewType,
    meetingPlatform,
    meetingLink,
    location,
    date,
    startTime,
    endTime,
    durationMinutes,
    timezone,
    instructions,
    agenda,
    status: 'invitation_sent',
  });

  interview.logActivity('scheduled', req.user.id, `${interviewRound} interview scheduled`);
  await interview.save();

  const populated = await populateInterview(Interview.findById(interview._id));

  await sendNotification({
    userId: application.candidateId,
    type: 'interview_scheduled',
    title: 'Interview scheduled',
    message: `You have an interview for ${application.jobId.title} on ${new Date(date).toDateString()}`,
    link: '/dashboard/candidate/interviews',
    relatedId: interview._id,
  });

  const candidate = await User.findById(application.candidateId);
  const emailContext = await buildEmailContext(populated);
  await sendTemplateEmail('interviewInvitation', candidate.email, emailContext);

  res.status(201).json({ success: true, interview: populated });
});

// @desc    Reschedule an interview
// @route   PUT /api/interviews/:id/reschedule
// @access  Private (employer)
exports.rescheduleInterview = asyncHandler(async (req, res, next) => {
  const { date, startTime, endTime, note } = req.body;

  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.employerId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.date = date;
  interview.startTime = startTime;
  interview.endTime = endTime;
  interview.status = 'rescheduled';
  interview.candidateResponse = { status: 'pending', note: '', respondedAt: undefined };
  interview.remindersSent = { hour24: false, hour1: false };
  interview.logActivity('rescheduled', req.user.id, note || 'Interview rescheduled by employer');
  await interview.save();

  await sendNotification({
    userId: interview.candidateId._id,
    type: 'interview_rescheduled',
    title: 'Interview rescheduled',
    message: `Your interview for ${interview.jobId.title} has a new time`,
    link: '/dashboard/candidate/interviews',
    relatedId: interview._id,
  });

  const emailContext = await buildEmailContext(interview);
  await sendTemplateEmail('interviewRescheduled', interview.candidateId.email, emailContext);

  res.status(200).json({ success: true, interview });
});

// @desc    Cancel an interview
// @route   PUT /api/interviews/:id/cancel
// @access  Private (employer)
exports.cancelInterview = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.employerId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.status = 'cancelled';
  interview.cancellation = { cancelledBy: req.user.id, reason: reason || '', cancelledAt: new Date() };
  interview.logActivity('cancelled', req.user.id, reason || '');
  await interview.save();

  await sendNotification({
    userId: interview.candidateId._id,
    type: 'interview_cancelled',
    title: 'Interview cancelled',
    message: `Your interview for ${interview.jobId.title} was cancelled`,
    link: '/dashboard/candidate/interviews',
    relatedId: interview._id,
  });

  const emailContext = await buildEmailContext(interview);
  await sendTemplateEmail('interviewCancelled', interview.candidateId.email, { ...emailContext, reason });

  res.status(200).json({ success: true, interview });
});

// @desc    Mark an interview as completed
// @route   PUT /api/interviews/:id/complete
// @access  Private (employer)
exports.markCompleted = asyncHandler(async (req, res, next) => {
  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.employerId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.status = 'completed';
  interview.logActivity('completed', req.user.id);
  await interview.save();

  res.status(200).json({ success: true, interview });
});

// @desc    Set interview outcome (selected / rejected / hold / next round)
// @route   PUT /api/interviews/:id/outcome
// @access  Private (employer)
exports.setOutcome = asyncHandler(async (req, res, next) => {
  const { outcome } = req.body;
  const validOutcomes = ['passed', 'failed', 'selected', 'rejected', 'on_hold', 'next_round'];
  if (!validOutcomes.includes(outcome)) {
    return next(new ErrorResponse('Invalid outcome value', 400));
  }

  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.employerId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.outcome = outcome;
  interview.logActivity('outcome_set', req.user.id, outcome);
  await interview.save();

  const emailContext = await buildEmailContext(interview);

  if (outcome === 'selected') {
    await sendTemplateEmail('interviewResultSelected', interview.candidateId.email, emailContext);
  } else if (outcome === 'rejected') {
    await sendTemplateEmail('interviewResultRejected', interview.candidateId.email, emailContext);
  } else if (outcome === 'next_round') {
    await sendTemplateEmail('interviewNextRound', interview.candidateId.email, emailContext);
  }

  await sendNotification({
    userId: interview.candidateId._id,
    type: 'interview_result',
    title: 'Interview result available',
    message: `There's an update on your interview for ${interview.jobId.title}`,
    link: '/dashboard/candidate/interviews',
    relatedId: interview._id,
  });

  res.status(200).json({ success: true, interview });
});

// @desc    Submit interviewer feedback + ratings
// @route   POST /api/interviews/:id/feedback
// @access  Private (employer)
exports.submitFeedback = asyncHandler(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.employerId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const {
    strengths,
    weaknesses,
    summary,
    technicalRating,
    communicationRating,
    culturalFitRating,
    overallRating,
    recommendation,
  } = req.body;

  interview.feedback.push({
    interviewerId: req.user.id,
    strengths,
    weaknesses,
    summary,
    technicalRating,
    communicationRating,
    culturalFitRating,
    overallRating,
    recommendation,
  });
  interview.logActivity('feedback_submitted', req.user.id);
  await interview.save();

  res.status(201).json({ success: true, interview, averageRating: interview.getAverageRating() });
});

// @desc    Update private employer notes
// @route   PUT /api/interviews/:id/notes
// @access  Private (employer)
exports.updateNotes = asyncHandler(async (req, res, next) => {
  const interview = await Interview.findById(req.params.id);
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.employerId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.employerNotes = req.body.notes || '';
  await interview.save();

  res.status(200).json({ success: true, interview });
});

// @desc    Get all interviews for the logged-in employer, with filters
// @route   GET /api/interviews/employer
// @access  Private (employer)
exports.getEmployerInterviews = asyncHandler(async (req, res) => {
  const filter = { employerId: req.user.id };

  if (req.query.status) filter.status = req.query.status;
  if (req.query.type) filter.interviewType = req.query.type;
  if (req.query.interviewerId) filter.interviewerIds = req.query.interviewerId;
  if (req.query.jobId) filter.jobId = req.query.jobId;

  if (req.query.range === 'today') {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    filter.date = { $gte: start, $lte: end };
  } else if (req.query.range === 'upcoming') {
    filter.date = { $gte: new Date() };
    filter.status = { $nin: ['cancelled', 'completed'] };
  }

  const interviews = await populateInterview(Interview.find(filter).sort({ date: 1 }));
  res.status(200).json({ success: true, interviews });
});

// @desc    Get all interviews for the logged-in candidate
// @route   GET /api/interviews/candidate
// @access  Private (candidate)
exports.getCandidateInterviews = asyncHandler(async (req, res) => {
  const filter = { candidateId: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const interviews = await populateInterview(Interview.find(filter).sort({ date: 1 }));

  // Strip private employer-only data before sending to the candidate —
  // same rule as the single-interview endpoint.
  const sanitized = interviews.map((i) => {
    const obj = i.toObject();
    delete obj.employerNotes;
    delete obj.feedback;
    return obj;
  });

  res.status(200).json({ success: true, interviews: sanitized });
});

// @desc    Get single interview detail
// @route   GET /api/interviews/:id
// @access  Private (candidate/employer/admin - participant only)
exports.getInterviewById = asyncHandler(async (req, res, next) => {
  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));

  const isCandidate = interview.candidateId._id.toString() === req.user.id;
  const isEmployer = interview.employerId._id.toString() === req.user.id;
  if (!isCandidate && !isEmployer && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  // Candidates should never see private employer notes or raw interviewer
  // feedback (ratings/strengths/weaknesses) — only an explicit outcome,
  // surfaced separately via the `outcome` field.
  const responseInterview = interview.toObject();
  if (isCandidate) {
    delete responseInterview.employerNotes;
    delete responseInterview.feedback;
  }

  res.status(200).json({ success: true, interview: responseInterview });
});

// @desc    Candidate responds to an interview invitation
// @route   PUT /api/interviews/:id/respond
// @access  Private (candidate)
exports.candidateRespond = asyncHandler(async (req, res, next) => {
  const { response, note } = req.body; // response: 'accepted' | 'declined' | 'reschedule_requested'
  const validResponses = ['accepted', 'declined', 'reschedule_requested'];
  if (!validResponses.includes(response)) {
    return next(new ErrorResponse('Invalid response value', 400));
  }

  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.candidateId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.candidateResponse = { status: response, note: note || '', respondedAt: new Date() };

  if (response === 'accepted') {
    interview.status = 'accepted';
  } else if (response === 'declined') {
    interview.status = 'declined';
  } else if (response === 'reschedule_requested') {
    interview.status = 'reschedule_requested';
    interview.rescheduleRequest = {
      requestedDate: req.body.requestedDate,
      requestedNote: note || '',
      requestedAt: new Date(),
    };
  }

  interview.logActivity(`candidate_${response}`, req.user.id, note || '');
  await interview.save();

  const notifMap = {
    accepted: { type: 'interview_accepted', title: 'Interview accepted', message: 'Candidate confirmed the interview' },
    declined: { type: 'interview_declined', title: 'Interview declined', message: 'Candidate declined the interview' },
    reschedule_requested: {
      type: 'interview_reschedule_requested',
      title: 'Reschedule requested',
      message: 'Candidate requested a new interview time',
    },
  };

  await sendNotification({
    userId: interview.employerId._id,
    ...notifMap[response],
    link: '/dashboard/employer/interviews',
    relatedId: interview._id,
  });

  res.status(200).json({ success: true, interview });
});

// @desc    Candidate marks that they joined the interview
// @route   PUT /api/interviews/:id/join
// @access  Private (candidate)
exports.candidateJoin = asyncHandler(async (req, res, next) => {
  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));
  if (interview.candidateId._id.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  interview.status = 'in_progress';
  interview.logActivity('candidate_joined', req.user.id);
  await interview.save();

  await sendNotification({
    userId: interview.employerId._id,
    type: 'interview_candidate_joined',
    title: 'Candidate joined the interview',
    message: `${interview.candidateId.name} has joined the interview`,
    link: '/dashboard/employer/interviews',
    relatedId: interview._id,
  });

  res.status(200).json({ success: true, interview });
});

// @desc    Download interview as .ics calendar file
// @route   GET /api/interviews/:id/calendar.ics
// @access  Private (participant only)
exports.downloadICS = asyncHandler(async (req, res, next) => {
  const interview = await populateInterview(Interview.findById(req.params.id));
  if (!interview) return next(new ErrorResponse('Interview not found', 404));

  const isCandidate = interview.candidateId._id.toString() === req.user.id;
  const isEmployer = interview.employerId._id.toString() === req.user.id;
  if (!isCandidate && !isEmployer && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const icsContent = buildInterviewICS(interview, interview.jobId.title, interview.companyId.name);

  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="interview-${interview._id}.ics"`);
  res.status(200).send(icsContent);
});

// @desc    Interview analytics for employer dashboard
// @route   GET /api/interviews/employer/analytics
// @access  Private (employer)
exports.getEmployerAnalytics = asyncHandler(async (req, res) => {
  const employerId = req.user.id;

  const [total, scheduled, completed, cancelled, selected, rejected] = await Promise.all([
    Interview.countDocuments({ employerId }),
    Interview.countDocuments({ employerId, status: { $in: ['scheduled', 'invitation_sent', 'accepted', 'rescheduled'] } }),
    Interview.countDocuments({ employerId, status: 'completed' }),
    Interview.countDocuments({ employerId, status: 'cancelled' }),
    Interview.countDocuments({ employerId, outcome: 'selected' }),
    Interview.countDocuments({ employerId, outcome: 'rejected' }),
  ]);

  const successRate = completed > 0 ? Math.round((selected / completed) * 100) : 0;

  res.status(200).json({
    success: true,
    analytics: { total, scheduled, completed, cancelled, selected, rejected, successRate },
  });
});

// @desc    Platform-wide interview analytics (admin)
// @route   GET /api/interviews/admin/analytics
// @access  Private (admin)
exports.getAdminAnalytics = asyncHandler(async (req, res) => {
  const [total, scheduledToday, completed, cancelled, byCompany] = await Promise.all([
    Interview.countDocuments(),
    Interview.countDocuments({
      date: {
        $gte: new Date(new Date().setHours(0, 0, 0, 0)),
        $lte: new Date(new Date().setHours(23, 59, 59, 999)),
      },
    }),
    Interview.countDocuments({ status: 'completed' }),
    Interview.countDocuments({ status: 'cancelled' }),
    Interview.aggregate([
      { $group: { _id: '$companyId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
      { $unwind: '$company' },
      { $project: { companyName: '$company.name', count: 1 } },
    ]),
  ]);

  const selectedCount = await Interview.countDocuments({ outcome: 'selected' });
  const successRate = completed > 0 ? Math.round((selectedCount / completed) * 100) : 0;

  res.status(200).json({
    success: true,
    analytics: { total, scheduledToday, completed, cancelled, successRate, byCompany },
  });
});
