const express = require('express');

const {
  getConversations,
  getMessages,
  startConversation,
  sendMessage,
} = require('../controllers/messageController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/conversations', getConversations);

router.get('/conversations/:id', getMessages);

router.post('/conversations', startConversation);

router.post(
  '/conversations/:id/messages',
  sendMessage
);

module.exports = router;