const express = require('express');
const router = express.Router();
const {
  applyToJob,
  withdrawApplication,
  getApplicantsForJob,
  getAllApplicantsForEmployer,
  updateApplicationStatus,
  getApplicationById,
} = require('../controllers/applicationController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { applicationValidation } = require('../utils/validators');

router.post('/:jobId', protect, authorize('candidate'), applicationValidation, validate, applyToJob);
router.put('/:id/withdraw', protect, authorize('candidate'), withdrawApplication);

router.get('/job/:jobId', protect, authorize('employer', 'admin'), getApplicantsForJob);
router.get('/employer/all', protect, authorize('employer'), getAllApplicantsForEmployer);
router.put('/:id/status', protect, authorize('employer', 'admin'), updateApplicationStatus);

router.get('/:id', protect, getApplicationById);

module.exports = router;
