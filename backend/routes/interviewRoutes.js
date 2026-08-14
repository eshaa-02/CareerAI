const express = require('express');
const router = express.Router();
const {
  scheduleInterview,
  rescheduleInterview,
  cancelInterview,
  markCompleted,
  setOutcome,
  submitFeedback,
  updateNotes,
  getEmployerInterviews,
  getCandidateInterviews,
  getInterviewById,
  candidateRespond,
  candidateJoin,
  downloadICS,
  getEmployerAnalytics,
  getAdminAnalytics,
} = require('../controllers/interviewController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { scheduleInterviewValidation, candidateRespondValidation } = require('../utils/validators');

router.use(protect);

// Employer actions
router.post('/', authorize('employer'), scheduleInterviewValidation, validate, scheduleInterview);
router.get('/employer', authorize('employer'), getEmployerInterviews);
router.get('/employer/analytics', authorize('employer'), getEmployerAnalytics);
router.put('/:id/reschedule', authorize('employer'), rescheduleInterview);
router.put('/:id/cancel', authorize('employer'), cancelInterview);
router.put('/:id/complete', authorize('employer'), markCompleted);
router.put('/:id/outcome', authorize('employer'), setOutcome);
router.post('/:id/feedback', authorize('employer'), submitFeedback);
router.put('/:id/notes', authorize('employer'), updateNotes);

// Admin analytics
router.get('/admin/analytics', authorize('admin'), getAdminAnalytics);

// Candidate actions
router.get('/candidate', authorize('candidate'), getCandidateInterviews);
router.put('/:id/respond', authorize('candidate'), candidateRespondValidation, validate, candidateRespond);
router.put('/:id/join', authorize('candidate'), candidateJoin);

// Shared
router.get('/:id', getInterviewById);
router.get('/:id/calendar.ics', downloadICS);

module.exports = router;
