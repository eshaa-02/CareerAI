const express = require('express');
const router = express.Router();
const {
  register,
  login,
  logout,
  getMe,
  updatePassword,
  forgotPassword,
  resetPassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const {
  registerValidation,
  loginValidation,
  updatePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require('../utils/validators');

router.post('/register', authLimiter, registerValidation, validate, register);
router.post('/login', authLimiter, loginValidation, validate, login);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/update-password', protect, updatePasswordValidation, validate, updatePassword);
router.post('/forgot-password', authLimiter, forgotPasswordValidation, validate, forgotPassword);
router.put('/reset-password/:resetToken', resetPasswordValidation, validate, resetPassword);

module.exports = router;
