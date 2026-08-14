const express = require('express');
const router = express.Router();
const { updateMe, updateAvatar, getUserById, deactivateMe } = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.put('/me', protect, updateMe);
router.put('/me/avatar', protect, upload.single('avatar'), updateAvatar);
router.delete('/me', protect, deactivateMe);
router.get('/:id', getUserById);

module.exports = router;
