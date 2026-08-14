const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const Job = require('../models/Job');
const Company = require('../models/Company');
const User = require('../models/User');
const { sendBulkNotification } = require('../services/notificationService');

// @desc    Create a job posting
// @route   POST /api/jobs
// @access  Private (employer)
exports.createJob = asyncHandler(async (req, res, next) => {
  const company = await Company.findOne({ ownerId: req.user.id });
  if (!company) {
    return next(new ErrorResponse('Please complete your company profile first', 400));
  }

  const job = await Job.create({
    ...req.body,
    employerId: req.user.id,
    companyId: company._id,
  });

  // Notify candidates who have this skill saved (best-effort, capped batch)
  if (job.skills && job.skills.length > 0) {
    const interestedCandidates = await User.find({
      role: 'candidate',
      skills: { $in: job.skills },
    })
      .select('_id')
      .limit(50);

    if (interestedCandidates.length > 0) {
      await sendBulkNotification(
        interestedCandidates.map((c) => c._id),
        {
          type: 'new_job_posted',
          title: 'New job matching your skills',
          message: `${job.title} at ${company.name} was just posted`,
          link: `/jobs/${job._id}`,
          relatedId: job._id,
        }
      );
    }
  }

  res.status(201).json({ success: true, job });
});

// @desc    Update a job posting
// @route   PUT /api/jobs/:id
// @access  Private (employer - owner only)
exports.updateJob = asyncHandler(async (req, res, next) => {
  let job = await Job.findById(req.params.id);
  if (!job) return next(new ErrorResponse('Job not found', 404));

  if (job.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this job', 403));
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, job });
});

// @desc    Delete a job posting
// @route   DELETE /api/jobs/:id
// @access  Private (employer - owner only)
exports.deleteJob = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new ErrorResponse('Job not found', 404));

  if (job.employerId.toString() !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this job', 403));
  }

  await job.deleteOne();
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get all jobs with search/filter/pagination
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const filter = { status: 'active' };

  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  if (req.query.location) {
    filter.location = { $regex: req.query.location, $options: 'i' };
  }
  if (req.query.type) {
    filter.type = req.query.type;
  }
  if (req.query.experience) {
    filter.experience = req.query.experience;
  }
  if (req.query.category) {
    filter.category = req.query.category;
  }
  if (req.query.isRemote === 'true') {
    filter.isRemote = true;
  }
  if (req.query.minSalary || req.query.maxSalary) {
    filter['salary.min'] = {};
    if (req.query.minSalary) filter['salary.min'].$gte = Number(req.query.minSalary);
    if (req.query.maxSalary) filter['salary.max'] = { $lte: Number(req.query.maxSalary) };
  }

  let sort = { createdAt: -1 };
  if (req.query.sort === 'salary-high') sort = { 'salary.max': -1 };
  if (req.query.sort === 'salary-low') sort = { 'salary.min': 1 };
  if (req.query.sort === 'oldest') sort = { createdAt: 1 };

  const [jobs, total] = await Promise.all([
    Job.find(filter)
      .populate('companyId', 'name logo verified location')
      .sort(sort)
      .skip(skip)
      .limit(limit),
    Job.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    jobs,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get single job by id (increments view count)
// @route   GET /api/jobs/:id
// @access  Public
exports.getJobById = asyncHandler(async (req, res, next) => {
  const job = await Job.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate('companyId', 'name logo verified location description website');

  if (!job) return next(new ErrorResponse('Job not found', 404));

  res.status(200).json({ success: true, job });
});

// @desc    Get jobs posted by logged-in employer
// @route   GET /api/jobs/employer/my-jobs
// @access  Private (employer)
exports.getMyJobs = asyncHandler(async (req, res) => {
  const filter = { employerId: req.user.id };
  if (req.query.status) filter.status = req.query.status;

  const jobs = await Job.find(filter).sort({ createdAt: -1 });
  res.status(200).json({ success: true, jobs });
});

// @desc    Get similar/trending jobs
// @route   GET /api/jobs/:id/similar
// @access  Public
exports.getSimilarJobs = asyncHandler(async (req, res, next) => {
  const job = await Job.findById(req.params.id);
  if (!job) return next(new ErrorResponse('Job not found', 404));

  const similar = await Job.find({
    _id: { $ne: job._id },
    status: 'active',
    $or: [{ category: job.category }, { skills: { $in: job.skills } }],
  })
    .populate('companyId', 'name logo')
    .limit(6);

  res.status(200).json({ success: true, jobs: similar });
});

// @desc    Get trending job categories (aggregated from real data)
// @route   GET /api/jobs/meta/categories
// @access  Public
exports.getTrendingCategories = asyncHandler(async (req, res) => {
  const categories = await Job.aggregate([
    { $match: { status: 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
    { $limit: 8 },
  ]);

  res.status(200).json({
    success: true,
    categories: categories.map((c) => ({ name: c._id, count: c.count })),
  });
});
