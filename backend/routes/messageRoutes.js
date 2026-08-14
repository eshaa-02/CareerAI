const express = require('express');

const {
  getConversations,
  getMessages,
  startConversation,
  sendMessage,
  searchMessagesUsers,
} = require('../controllers/messageController');

const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

/*
|--------------------------------------------------------------------------
| Search
|--------------------------------------------------------------------------
| IMPORTANT:
| This must be before /conversations/:id
*/
router.get('/search', searchMessagesUsers);

/*
|--------------------------------------------------------------------------
| Conversations
|--------------------------------------------------------------------------
*/
router.get('/conversations', getConversations);

router.post('/conversations', startConversation);

router.get('/conversations/:id', getMessages);

router.post(
  '/conversations/:id/messages',
  sendMessage
);

module.exports = router;