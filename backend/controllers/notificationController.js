const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const Notification = require('../models/Notification');

// @desc    Get logged-in user's notifications
// @route   GET /api/notifications
// @access  Private
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const [notifications, unreadCount, total] = await Promise.all([
    Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Notification.countDocuments({ userId: req.user.id, read: false }),
    Notification.countDocuments({ userId: req.user.id }),
  ]);

  res.status(200).json({
    success: true,
    notifications,
    unreadCount,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  });
});

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new ErrorResponse('Notification not found', 404));
  if (notification.userId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  notification.read = true;
  await notification.save();

  res.status(200).json({ success: true, notification });
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ userId: req.user.id, read: false }, { read: true });
  res.status(200).json({ success: true, message: 'All notifications marked as read' });
});

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification) return next(new ErrorResponse('Notification not found', 404));
  if (notification.userId.toString() !== req.user.id) {
    return next(new ErrorResponse('Not authorized', 403));
  }
  await notification.deleteOne();
  res.status(200).json({ success: true, data: {} });
});
