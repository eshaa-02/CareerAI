const asyncHandler = require('../middleware/asyncHandler');
const Job = require('../models/Job');
const Application = require('../models/Application');
const Company = require('../models/Company');

// @desc    Get employer dashboard analytics (real DB data)
// @route   GET /api/employer/analytics
// @access  Private (employer)
exports.getEmployerAnalytics = asyncHandler(async (req, res) => {
  const employerId = req.user.id;

  const [
    totalJobs,
    activeJobs,
    closedJobs,
    totalApplications,
    shortlisted,
    accepted,
    rejected,
    company,
  ] = await Promise.all([
    Job.countDocuments({ employerId }),
    Job.countDocuments({ employerId, status: 'active' }),
    Job.countDocuments({ employerId, status: 'closed' }),
    Application.countDocuments({ employerId }),
    Application.countDocuments({ employerId, status: 'shortlisted' }),
    Application.countDocuments({ employerId, status: 'accepted' }),
    Application.countDocuments({ employerId, status: 'rejected' }),
    Company.findOne({ ownerId: employerId }),
  ]);

  const applicationsOverTime = await Application.aggregate([
    { $match: { employerId: req.user._id } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          day: { $dayOfMonth: '$createdAt' },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } },
    { $limit: 30 },
  ]);

  const topJobsByApplicants = await Job.find({ employerId })
    .sort({ applicationsCount: -1 })
    .limit(5)
    .select('title applicationsCount views status');

  res.status(200).json({
    success: true,
    analytics: {
      totals: {
        totalJobs,
        activeJobs,
        closedJobs,
        totalApplications,
        shortlisted,
        accepted,
        rejected,
      },
      companyVerified: company ? company.verified : false,
      applicationsOverTime,
      topJobsByApplicants,
    },
  });
});
