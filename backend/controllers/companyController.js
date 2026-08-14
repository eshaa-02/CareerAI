const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const Company = require('../models/Company');
const Job = require('../models/Job');

// @desc    Get logged-in employer's company profile
// @route   GET /api/companies/me
// @access  Private (employer)
exports.getMyCompany = asyncHandler(async (req, res) => {
  let company = await Company.findOne({ ownerId: req.user.id });
  if (!company) {
    company = await Company.create({ ownerId: req.user.id, name: `${req.user.name}'s Company` });
  }
  res.status(200).json({ success: true, company });
});

// @desc    Update company profile
// @route   PUT /api/companies/me
// @access  Private (employer)
exports.updateMyCompany = asyncHandler(async (req, res) => {
  const allowedFields = [
    'name',
    'industry',
    'companySize',
    'foundedYear',
    'description',
    'website',
    'location',
    'socialLinks',
  ];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const company = await Company.findOneAndUpdate(
    { ownerId: req.user.id },
    updates,
    { new: true, upsert: true, runValidators: true }
  );

  res.status(200).json({ success: true, company });
});

// @desc    Upload company logo
// @route   PUT /api/companies/me/logo
// @access  Private (employer)
exports.updateLogo = asyncHandler(async (req, res, next) => {
  if (!req.file) return next(new ErrorResponse('Please upload a logo image', 400));

  const fileUrl = `/uploads/logos/${req.file.filename}`;
  const company = await Company.findOneAndUpdate(
    { ownerId: req.user.id },
    { logo: { url: fileUrl, publicId: req.file.filename } },
    { new: true, upsert: true }
  );

  res.status(200).json({ success: true, company });
});

// @desc    Get all companies (public directory)
// @route   GET /api/companies
// @access  Public
exports.getCompanies = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const filter = {};
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }
  if (req.query.industry) {
    filter.industry = req.query.industry;
  }

  const [companies, total] = await Promise.all([
    Company.find(filter).sort({ verified: -1, createdAt: -1 }).skip(skip).limit(limit),
    Company.countDocuments(filter),
  ]);

  // Attach live open-job counts
  const withJobCounts = await Promise.all(
    companies.map(async (c) => {
      const jobCount = await Job.countDocuments({ companyId: c._id, status: 'active' });
      return { ...c.toObject(), openJobs: jobCount };
    })
  );

  res.status(200).json({
    success: true,
    companies: withJobCounts,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Get single company profile (public) with its active jobs
// @route   GET /api/companies/:id
// @access  Public
exports.getCompanyById = asyncHandler(async (req, res, next) => {
  const company = await Company.findById(req.params.id);
  if (!company) return next(new ErrorResponse('Company not found', 404));

  const jobs = await Job.find({ companyId: company._id, status: 'active' }).sort({
    createdAt: -1,
  });

  res.status(200).json({ success: true, company, jobs });
});
