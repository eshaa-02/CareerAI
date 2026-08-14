const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const User = require('../models/User');

// @desc    Update basic user account details (name, phone, location, skills)
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = asyncHandler(async (req, res, next) => {
  const allowedFields = ['name', 'phone', 'location', 'skills'];
  const updates = {};
  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user.id, updates, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Upload / update avatar
// @route   PUT /api/users/me/avatar
// @access  Private
exports.updateAvatar = asyncHandler(async (req, res, next) => {
  if (!req.file) {
    return next(new ErrorResponse('Please upload an image file', 400));
  }

  const fileUrl = `/uploads/avatars/${req.file.filename}`;

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatar: { url: fileUrl, publicId: req.file.filename } },
    { new: true }
  );

  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Get public profile of a user by id
// @route   GET /api/users/:id
// @access  Public
exports.getUserById = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(new ErrorResponse('User not found', 404));
  }
  res.status(200).json({ success: true, user: user.toSafeObject() });
});

// @desc    Deactivate own account
// @route   DELETE /api/users/me
// @access  Private
exports.deactivateMe = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user.id, { isActive: false });
  res.cookie('token', 'none', { expires: new Date(Date.now() + 10 * 1000), httpOnly: true });
  res.status(200).json({ success: true, message: 'Account deactivated' });
});
