const { body } = require('express-validator');

exports.registerValidation = [
  body('name').trim().isLength({ min: 2, max: 60 }).withMessage('Name must be 2-60 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/\d/)
    .withMessage('Password must contain at least one number'),
  body('role').optional().isIn(['candidate', 'employer']).withMessage('Invalid role'),
];

exports.loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
];

exports.updatePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters'),
];

exports.forgotPasswordValidation = [
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
];

exports.resetPasswordValidation = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
];

exports.jobValidation = [
  body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3-150 characters'),
  body('description').trim().isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('skills').isArray({ min: 1 }).withMessage('At least one skill is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('type')
    .isIn(['full-time', 'part-time', 'contract', 'internship', 'remote'])
    .withMessage('Invalid job type'),
  body('experience')
    .isIn(['entry', 'junior', 'mid', 'senior', 'lead', 'executive'])
    .withMessage('Invalid experience level'),
  body('deadline').isISO8601().toDate().withMessage('Valid deadline date is required'),
];

exports.applicationValidation = [
  body('coverLetter').optional().isLength({ max: 3000 }).withMessage('Cover letter too long'),
];

exports.scheduleInterviewValidation = [
  body('applicationId').notEmpty().withMessage('applicationId is required'),
  body('interviewType')
    .isIn(['online', 'on-site', 'phone-call', 'technical-assessment', 'hr-interview', 'final-interview'])
    .withMessage('Invalid interview type'),
  body('date').isISO8601().withMessage('Valid interview date is required'),
  body('startTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('startTime must be in HH:mm format'),
  body('endTime').matches(/^([01]\d|2[0-3]):([0-5]\d)$/).withMessage('endTime must be in HH:mm format'),
];

exports.candidateRespondValidation = [
  body('response').isIn(['accepted', 'declined', 'reschedule_requested']).withMessage('Invalid response'),
];

exports.companyValidation = [
  body('name').optional().trim().isLength({ min: 2, max: 120 }).withMessage('Company name must be 2-120 characters'),
  body('website').optional({ checkFalsy: true }).isURL().withMessage('Website must be a valid URL'),
];
