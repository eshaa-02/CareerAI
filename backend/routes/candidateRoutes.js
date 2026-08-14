const express = require('express');
const router = express.Router();
const {
  getMyProfile,
  updateMyProfile,
  uploadResume,
  addEducation,
  deleteEducation,
  addExperience,
  deleteExperience,
  addCertificate,
  deleteCertificate,
  toggleSavedJob,
  getSavedJobs,
  getJobMatch,
  getRecommendedJobs,
  getMyApplications,
} = require('../controllers/candidateController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.use(protect, authorize('candidate'));

router.get('/me', getMyProfile);
router.put('/me', updateMyProfile);
router.put('/me/resume', upload.single('resume'), uploadResume);

router.post('/me/education', addEducation);
router.delete('/me/education/:eduId', deleteEducation);

router.post('/me/experience', addExperience);
router.delete('/me/experience/:expId', deleteExperience);

router.post('/me/certificates', addCertificate);
router.delete('/me/certificates/:certId', deleteCertificate);

router.put('/me/saved-jobs/:jobId', toggleSavedJob);
router.get('/me/saved-jobs', getSavedJobs);

router.get('/me/match/:jobId', getJobMatch);
router.get('/me/recommended-jobs', getRecommendedJobs);
router.get('/me/applications', getMyApplications);

module.exports = router;
