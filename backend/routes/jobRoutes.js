const express = require('express');
const router = express.Router();
const {
  createJob,
  updateJob,
  deleteJob,
  getJobs,
  getJobById,
  getMyJobs,
  getSimilarJobs,
  getTrendingCategories,
} = require('../controllers/jobController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { jobValidation } = require('../utils/validators');

router.get('/', getJobs);
router.get('/meta/categories', getTrendingCategories);
router.get('/employer/my-jobs', protect, authorize('employer'), getMyJobs);
router.post('/', protect, authorize('employer'), jobValidation, validate, createJob);
router.get('/:id', getJobById);
router.get('/:id/similar', getSimilarJobs);
router.put('/:id', protect, authorize('employer', 'admin'), updateJob);
router.delete('/:id', protect, authorize('employer', 'admin'), deleteJob);

module.exports = router;
