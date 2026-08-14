const express = require('express');
const router = express.Router();
const { getPublicStats, getHomepageContent } = require('../controllers/statsController');

router.get('/public', getPublicStats);
router.get('/homepage-content', getHomepageContent);

module.exports = router;
