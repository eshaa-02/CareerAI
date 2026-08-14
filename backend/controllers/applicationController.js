const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const Application = require('../models/Application');
const Job = require('../models/Job');
const CandidateProfile = require('../models/CandidateProfile');
const { matchCandidateToJob } = require('../services/aiMatchingService');
const { sendNotification } = require('../services/notificationService');

// @desc    Apply to a job
// @route   POST /api/applications/:jobId
// @access  Private (candidate)
exports.applyToJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new ErrorResponse('Job not found', 404));
  if (job.status !== 'active') {
    return next(new ErrorResponse('This job is no longer accepting applications', 400));
  }

  const existing = await Application.findOne({
    jobId: job._id,
    candidateId: req.user.id,
  });
  if (existing) {
    return next(new ErrorResponse('You have already applied to this job', 400));
  }

  const profile = await CandidateProfile.findOne({ userId: req.user.id });
  if (!profile || !profile.resume || !profile.resume.url) {
    return next(new ErrorResponse('Please upload a resume before applying', 400));
  }

  const match = matchCandidateToJob(profile, job);

  const application = await Application.create({
    jobId: job._id,
    candidateId: req.user.id,
    employerId: job.employerId,
    resume: { url: profile.resume.url, fileName: profile.resume.fileName },
    coverLetter: req.body.coverLetter || '',
    matchScore: match.matchScore,
    matchDetails: {
      matchedSkills: match.matchedSkills,
      missingSkills: match.missingSkills,
      recommendation: match.recommendation,
    },
    statusHistory: [{ status: 'pending', note: 'Application submitted' }],
  });

  job.applicationsCount += 1;
  await job.save();

  await sendNotification({
    userId: job.employerId,
    type: 'application_received',
    title: 'New candidate applied',
    message: `A new candidate applied to ${job.title}`,
    link: `/dashboard/employer/applicants/${job._id}`,
    relatedId: application._id,
  });

  res.status(201).json({ success: true, application });
});

// @desc    Withdraw an application
// @route   PUT /api/applications/:id/withdraw
// @access  Private (candidate - owner only)
exports.withdrawApplication = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id);
  if (!application) return next(new ErrorResponse('Application not found', 404));
  if (application.candidateId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  application.status = 'withdrawn';
  application.statusHistory.push({ status: 'withdrawn', note: 'Withdrawn by candidate' });
  await application.save();

  res.status(200).json({ success: true, application });
});

// @desc    Get applicants for a specific job (employer view)
// @route   GET /api/applications/job/:jobId
// @access  Private (employer - owner only)
exports.getApplicantsForJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new ErrorResponse('Job not found', 404));
  if (job.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const filter = { jobId: job._id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .populate('candidateId', 'name email avatar phone location skills')
    .sort({ matchScore: -1, createdAt: -1 });

  res.status(200).json({ success: true, applications, job });
});

// @desc    Get all applicants across all of employer's jobs
// @route   GET /api/applications/employer/all
// @access  Private (employer)
exports.getAllApplicantsForEmployer = asyncHandler(async (req, res) => {
  const filter = { employerId: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const applications = await Application.find(filter)
    .populate('candidateId', 'name email avatar location skills')
    .populate('jobId', 'title location type')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, applications });
});

// @desc    Update application status (shortlist / reject / accept)
// @route   PUT /api/applications/:id/status
// @access  Private (employer - owner only)
exports.updateApplicationStatus = asyncHandler(async (req, res, next) => {
  const { status, note } = req.body;
  const validStatuses = ['pending', 'shortlisted', 'rejected', 'accepted'];
  if (!validStatuses.includes(status)) {
    return next(new ErrorResponse('Invalid status value', 400));
  }

  const application = await Application.findById(req.params.id).populate('jobId', 'title');
  if (!application) return next(new ErrorResponse('Application not found', 404));
  if (application.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  application.status = status;
  application.statusHistory.push({ status, note: note || '' });
  await application.save();

  const notifMap = {
    shortlisted: {
      type: 'application_shortlisted',
      title: 'Your application was shortlisted',
      message: `You've been shortlisted for ${application.jobId.title}`,
    },
    rejected: {
      type: 'application_rejected',
      title: 'Application update',
      message: `Your application for ${application.jobId.title} was not selected this time`,
    },
    accepted: {
      type: 'application_accepted',
      title: 'Congratulations! You got the job',
      message: `You've been accepted for ${application.jobId.title}`,
    },
  };

  if (notifMap[status]) {
    await sendNotification({
      userId: application.candidateId,
      ...notifMap[status],
      link: `/dashboard/candidate/applications`,
      relatedId: application._id,
    });
  }

  res.status(200).json({ success: true, application });
});

// @desc    Get single application detail
// @route   GET /api/applications/:id
// @access  Private (owner candidate, owner employer, or admin)
exports.getApplicationById = asyncHandler(async (req, res, next) => {
  const application = await Application.findById(req.params.id)
    .populate('candidateId', 'name email avatar phone location skills')
    .populate({ path: 'jobId', populate: { path: 'companyId', select: 'name logo' } });

  if (!application) return next(new ErrorResponse('Application not found', 404));

  const isOwnerCandidate = application.candidateId._id.toString() === req.user.id;
  const isOwnerEmployer = application.employerId.toString() === req.user.id;
  if (!isOwnerCandidate && !isOwnerEmployer && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized', 403));
  }

  res.status(200).json({ success: true, application });
});
