const crypto = require('crypto');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const sendTokenResponse = require('../utils/sendTokenResponse');
const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const Company = require('../models/Company');
const { sendBulkNotification } = require('../services/notificationService');
const { sendTemplateEmail } = require('../services/emailService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, companyName } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return next(new ErrorResponse('An account with this email already exists', 400));
  }

  const user = await User.create({
    name,
    email,
    password,
    role: role === 'employer' ? 'employer' : 'candidate',
  });

  if (user.role === 'candidate') {
    await CandidateProfile.create({ userId: user._id });
  } else if (user.role === 'employer') {
    await Company.create({
      ownerId: user._id,
      name: companyName || `${name}'s Company`,
    });
  }

  // Notify all admins of new registration
  const admins = await User.find({ role: 'admin' }).select('_id');
  if (admins.length > 0) {
    await sendBulkNotification(
      admins.map((a) => a._id),
      {
        type: 'new_user_registered',
        title: 'New user registered',
        message: `${user.name} joined as a ${user.role}`,
        link: '/dashboard/admin/users',
        relatedId: user._id,
      }
    );
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorResponse('Please provide an email and password', 400));
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  if (!user.isActive || user.isSuspended) {
    return next(new ErrorResponse('This account has been suspended', 403));
  }

  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  sendTokenResponse(user, 200, res);
});

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true,
  });
  res.status(200).json({ success: true, data: {} });
});

// @desc    Get currently logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res) => {
  res.status(200).json({ success: true, user: req.user.toSafeObject() });
});

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id).select('+password');
  const { currentPassword, newPassword } = req.body;

  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  sendTokenResponse(user, 200, res);
});

// @desc    Forgot password - generate reset token and email it
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });

  // Deliberately return the same success response whether or not the email
  // exists — returning a different response for "no account found" lets an
  // attacker enumerate which emails are registered. The user just won't
  // receive an email if there's no account.
  if (!user) {
    return res.status(200).json({
      success: true,
      message: 'If an account exists with that email, a reset link has been sent.',
    });
  }

  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const emailResult = await sendTemplateEmail('passwordReset', user.email, {
    name: user.name,
    resetUrl,
  });

  // If SMTP isn't configured (local dev with no provider set), fall back to
  // logging the reset URL server-side so the flow is still testable without
  // real email infrastructure — but never in the HTTP response itself.
  if (!emailResult.sent) {
    console.log(`[password-reset:dev-mode] Reset URL for ${user.email}: ${resetUrl}`);
  }

  res.status(200).json({
    success: true,
    message: 'If an account exists with that email, a reset link has been sent.',
  });
});

// @desc    Reset password using token
// @route   PUT /api/auth/reset-password/:resetToken
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorResponse('Invalid or expired reset token', 400));
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  sendTokenResponse(user, 200, res);
});
