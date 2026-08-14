const express = require('express');
const router = express.Router();
const { getEmployerAnalytics } = require('../controllers/employerController');
const { protect, authorize } = require('../middleware/auth');

router.get('/analytics', protect, authorize('employer'), getEmployerAnalytics);

module.exports = router;
