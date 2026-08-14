const express = require('express');
const router = express.Router();
const {
  getMyCompany,
  updateMyCompany,
  updateLogo,
  getCompanies,
  getCompanyById,
} = require('../controllers/companyController');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const validate = require('../middleware/validate');
const { companyValidation } = require('../utils/validators');

router.get('/', getCompanies);
router.get('/me', protect, authorize('employer'), getMyCompany);
router.put('/me', protect, authorize('employer'), companyValidation, validate, updateMyCompany);
router.put('/me/logo', protect, authorize('employer'), upload.single('logo'), updateLogo);
router.get('/:id', getCompanyById);

module.exports = router;
