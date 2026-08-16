const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const CandidateProfile = require('../models/CandidateProfile');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');
const { matchCandidateToJob } = require('../services/aiMatchingService');

const getOrCreateProfile = async (userId) => {
  let profile = await CandidateProfile.findOne({ userId });
  if (!profile) profile = await CandidateProfile.create({ userId });
  return profile;
};

// @desc    Get logged-in candidate's full profile
// @route   GET /api/candidates/me
// @access  Private (candidate)
exports.getMyProfile = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.calculateCompletion(req.user);
  await profile.save();

  res.status(200).json({
    success: true,
    profile,
    completionPercentage: profile.completionPercentage,
  });
});

// @desc    Update candidate profile (headline, bio, skills, links, etc.)
// @route   PUT /api/candidates/me
// @access  Private (candidate)
exports.updateMyProfile = asyncHandler(async (req, res) => {
  const allowedFields = [
    'headline',
    'bio',
    'skills',
    'desiredJobTitle',
    'desiredSalary',
    'availability',
    'links',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  let profile = await CandidateProfile.findOneAndUpdate(
    { userId: req.user.id },
    updates,
    { new: true, upsert: true, runValidators: true }
  );

  profile.calculateCompletion(req.user);
  await profile.save();

  res.status(200).json({ success: true, profile });
});

// @desc    Upload resume
// @route   PUT /api/candidates/me/resume
// @access  Private (candidate)
exports.uploadResume = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload a resume file', 400));
  }

  const fileUrl = `/uploads/resumes/${req.file.filename}`;

  let profile = await CandidateProfile.findOneAndUpdate(
    { userId: req.user.id },
    {
      resume: {
        url: fileUrl,
        fileName: req.file.originalname,
        uploadedAt: new Date(),
      },
    },
    { new: true, upsert: true }
  );

  profile.calculateCompletion(req.user);
  await profile.save();

  res.status(200).json({ success: true, profile });
});

// @desc    Add education entry
// @route   POST /api/candidates/me/education
// @access  Private (candidate)
exports.addEducation = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.education.push(req.body);
  profile.calculateCompletion(req.user);
  await profile.save();
  res.status(201).json({ success: true, profile });
});

// @desc    Delete education entry
// @route   DELETE /api/candidates/me/education/:eduId
// @access  Private (candidate)
exports.deleteEducation = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.education = profile.education.filter(
    (e) => e._id.toString() !== req.params.eduId
  );
  profile.calculateCompletion(req.user);
  await profile.save();
  res.status(200).json({ success: true, profile });
});

// @desc    Add experience entry
// @route   POST /api/candidates/me/experience
// @access  Private (candidate)
exports.addExperience = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.experience.push(req.body);
  profile.calculateCompletion(req.user);
  await profile.save();
  res.status(201).json({ success: true, profile });
});

// @desc    Delete experience entry
// @route   DELETE /api/candidates/me/experience/:expId
// @access  Private (candidate)
exports.deleteExperience = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.experience = profile.experience.filter(
    (e) => e._id.toString() !== req.params.expId
  );
  profile.calculateCompletion(req.user);
  await profile.save();
  res.status(200).json({ success: true, profile });
});

// @desc    Add certificate
// @route   POST /api/candidates/me/certificates
// @access  Private (candidate)
exports.addCertificate = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.certificates.push(req.body);
  await profile.save();
  res.status(201).json({ success: true, profile });
});

// @desc    Delete certificate
// @route   DELETE /api/candidates/me/certificates/:certId
// @access  Private (candidate)
exports.deleteCertificate = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);
  profile.certificates = profile.certificates.filter(
    (c) => c._id.toString() !== req.params.certId
  );
  await profile.save();
  res.status(200).json({ success: true, profile });
});

// @desc    Save / unsave a job
// @route   PUT /api/candidates/me/saved-jobs/:jobId
// @access  Private (candidate)
exports.toggleSavedJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new ErrorResponse('Job not found', 404));

  const profile = await getOrCreateProfile(req.user.id);
  const idx = profile.savedJobs.findIndex(
    (id) => id.toString() === req.params.jobId
  );

  let saved;
  if (idx > -1) {
    profile.savedJobs.splice(idx, 1);
    saved = false;
  } else {
    profile.savedJobs.push(req.params.jobId);
    saved = true;
  }
  await profile.save();

  res.status(200).json({ success: true, saved });
});

// @desc    Get saved jobs
// @route   GET /api/candidates/me/saved-jobs
// @access  Private (candidate)
exports.getSavedJobs = asyncHandler(async (req, res) => {
  const profile = await CandidateProfile.findOne({ userId: req.user.id }).populate({
    path: 'savedJobs',
    populate: { path: 'companyId', select: 'name logo' },
  });
  res.status(200).json({ success: true, jobs: profile ? profile.savedJobs : [] });
});

// @desc    Get AI match score + breakdown for a specific job
// @route   GET /api/candidates/me/match/:jobId
// @access  Private (candidate)
exports.getJobMatch = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.jobId);
  if (!job) return next(new ErrorResponse('Job not found', 404));

  const profile = await getOrCreateProfile(req.user.id);
  const result = matchCandidateToJob(profile, job);

  res.status(200).json({ success: true, match: result });
});

// @desc    Get AI-recommended jobs ranked by match score
// @route   GET /api/candidates/me/recommended-jobs
// @access  Private (candidate)
exports.getRecommendedJobs = asyncHandler(async (req, res) => {
  const profile = await getOrCreateProfile(req.user.id);

  const jobs = await Job.find({
    status: 'active',
  })
    .populate('companyId', 'name logo verified')
    .sort({ createdAt: -1 })
    .limit(100);

  const scored = jobs
    .map((job) => {
      const match = matchCandidateToJob(profile, job);

      return {
        job,
        matchScore: match.matchScore,
        match,
      };
    })
    // HARD FILTER: irrelevant career fields never appear
    .filter((item) => item.match.relevant === true)
    // Don't show extremely poor matches either
    .filter((item) => item.matchScore >= 25)
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 20);

  res.status(200).json({
    success: true,
    jobs: scored,
  });
});

// @desc    Get candidate's application tracking overview
// @route   GET /api/candidates/me/applications
// @access  Private (candidate)
exports.getMyApplications = asyncHandler(async (req, res) => {
  const applications = await Application.find({ candidateId: req.user.id })
    .populate({
      path: 'jobId',
      populate: { path: 'companyId', select: 'name logo' },
    })
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, applications });
});
