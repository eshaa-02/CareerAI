const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');
const Company = require('../models/Company');
const Job = require('../models/Job');
const Application = require('../models/Application');
const { sendNotification } = require('../services/notificationService');

// @desc    Get admin dashboard analytics (all real DB aggregates)
// @route   GET /api/admin/analytics
// @access  Private (admin)
exports.getAnalytics = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalCandidates,
    totalEmployers,
    totalJobs,
    activeJobs,
    totalApplications,
    totalCompanies,
    verifiedCompanies,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'candidate' }),
    User.countDocuments({ role: 'employer' }),
    Job.countDocuments(),
    Job.countDocuments({ status: 'active' }),
    Application.countDocuments(),
    Company.countDocuments(),
    Company.countDocuments({ verified: true }),
  ]);

  // Last 6 months of user growth
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const userGrowth = await User.aggregate([
    { $match: { createdAt: { $gte: sixMonthsAgo } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const applicationsByStatus = await Application.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const jobsByCategory = await Job.aggregate([
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 10 },
  ]);

  res.status(200).json({
    success: true,
    analytics: {
      totals: {
        users: totalUsers,
        candidates: totalCandidates,
        employers: totalEmployers,
        jobs: totalJobs,
        activeJobs,
        applications: totalApplications,
        companies: totalCompanies,
        verifiedCompanies,
      },
      userGrowth,
      applicationsByStatus,
      jobsByCategory,
    },
  });
});

// @desc    Get all users with filters
// @route   GET /api/admin/users
// @access  Private (admin)
exports.getUsers = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.search) filter.$text = { $search: req.query.search };

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    users,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Suspend / unsuspend a user
// @route   PUT /api/admin/users/:id/suspend
// @access  Private (admin)
exports.toggleSuspendUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));

  user.isSuspended = !user.isSuspended;
  await user.save();

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Delete a user
// @route   DELETE /api/admin/users/:id
// @access  Private (admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) return next(new ErrorResponse('User not found', 404));
  await user.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get all companies for admin review
// @route   GET /api/admin/companies
// @access  Private (admin)
exports.getCompanies = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.verified !== undefined) filter.verified = req.query.verified === 'true';

  const companies = await Company.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, companies });
});

// @desc    Verify a company
// @route   PUT /api/admin/companies/:id/verify
// @access  Private (admin)
exports.verifyCompany = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new ErrorResponse('Company not found', 404));

  company.verified = true;
  await company.save();

  await sendNotification({
    userId: company.ownerId,
    type: 'company_verified',
    title: 'Company verified',
    message: `${company.name} has been verified by our team`,
    link: '/dashboard/employer/company',
    relatedId: company._id,
  });

  res.status(200).json({ success: true, company });
});

// @desc    Get all jobs for admin moderation
// @route   GET /api/admin/jobs
// @access  Private (admin)
exports.getJobs = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.status) filter.status = req.query.status;

  const jobs = await Job.find(filter)
    .populate('companyId', 'name logo')
    .populate('employerId', 'name email')
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, jobs });
});

// @desc    Remove/close a job (moderation)
// @route   PUT /api/admin/jobs/:id/close
// @access  Private (admin)
exports.closeJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { status: 'closed' },
    { new: true }
  );
  if (!job) return next(new ErrorResponse('Job not found', 404));
  res.status(200).json({ success: true, job });
});
