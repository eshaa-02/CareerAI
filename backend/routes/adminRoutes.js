const express = require('express');
const router = express.Router();
const {
  getAnalytics,
  getUsers,
  toggleSuspendUser,
  deleteUser,
  getCompanies,
  verifyCompany,
  getJobs,
  closeJob,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/analytics', getAnalytics);

router.get('/users', getUsers);
router.put('/users/:id/suspend', toggleSuspendUser);
router.delete('/users/:id', deleteUser);

router.get('/companies', getCompanies);
router.put('/companies/:id/verify', verifyCompany);

router.get('/jobs', getJobs);
router.put('/jobs/:id/close', closeJob);

module.exports = router;
