const asyncHandler = require('../middleware/asyncHandler');
const User = require('../models/User');
const Job = require('../models/Job');
const Company = require('../models/Company');
const Application = require('../models/Application');

// @desc    Get public homepage statistics (real DB counts, no hardcoded values)
// @route   GET /api/stats/public
// @access  Public
exports.getPublicStats = asyncHandler(async (req, res) => {
  const [totalJobs, totalCompanies, totalCandidates, totalApplications] =
    await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Company.countDocuments(),
      User.countDocuments({ role: 'candidate' }),
      Application.countDocuments(),
    ]);

  res.status(200).json({
    success: true,
    stats: {
      totalJobs,
      totalCompanies,
      totalCandidates,
      totalApplications,
    },
  });
});

// @desc    Get featured/latest jobs and companies for homepage
// @route   GET /api/stats/homepage-content
// @access  Public
exports.getHomepageContent = asyncHandler(async (req, res) => {
  const [latestJobs, featuredCompanies, trendingCategories] = await Promise.all([
    Job.find({ status: 'active' })
      .populate('companyId', 'name logo verified')
      .sort({ createdAt: -1 })
      .limit(8),
    Company.find({ verified: true }).sort({ createdAt: -1 }).limit(8),
    Job.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]),
  ]);

  res.status(200).json({
    success: true,
    latestJobs,
    featuredCompanies,
    trendingCategories: trendingCategories.map((c) => ({ name: c._id, count: c.count })),
  });
});
