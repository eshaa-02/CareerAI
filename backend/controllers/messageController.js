const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { Conversation, Message } = require('../models/Message');

// @desc    Get all conversations for logged-in user
// @route   GET /api/messages/conversations
// @access  Private
exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({ participants: req.user.id })
    .populate('participants', 'name avatar role')
    .sort({ lastMessageAt: -1 });

  // Attach unread count per conversation
  const withUnread = await Promise.all(
    conversations.map(async (conv) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conv._id,
        receiverId: req.user.id,
        read: false,
      });
      return { ...conv.toObject(), unreadCount };
    })
  );

  res.status(200).json({ success: true, conversations: withUnread });
});

// @desc    Get message history for a conversation
// @route   GET /api/messages/conversations/:id
// @access  Private
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);
  if (!conversation) return next(new ErrorResponse('Conversation not found', 404));

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user.id
  );
  if (!isParticipant) return next(new ErrorResponse('Not authorized', 403));

  const messages = await Message.find({ conversationId: conversation._id }).sort({
    createdAt: 1,
  });

  await Message.updateMany(
    { conversationId: conversation._id, receiverId: req.user.id, read: false },
    { read: true }
  );

  res.status(200).json({ success: true, messages });
});

// @desc    Start (or get existing) conversation with another user
// @route   POST /api/messages/conversations
// @access  Private
exports.startConversation = asyncHandler(async (req, res, next) => {
  const { participantId } = req.body;
  if (!participantId) return next(new ErrorResponse('participantId is required', 400));

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user.id, participantId], $size: 2 },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, participantId],
    });
  }

  await conversation.populate('participants', 'name avatar role');

  res.status(200).json({ success: true, conversation });
});

// @desc    Send a message
// @route   POST /api/messages/conversations/:id/messages
// @access  Private
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return next(new ErrorResponse('Message content is required', 400));
  }

  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new ErrorResponse('Conversation not found', 404));
  }

  const isParticipant = conversation.participants.some(
    (p) => p.toString() === req.user.id.toString()
  );

  if (!isParticipant) {
    return next(new ErrorResponse('Not authorized', 403));
  }

  const receiverId = conversation.participants.find(
    (p) => p.toString() !== req.user.id.toString()
  );

  if (!receiverId) {
    return next(new ErrorResponse('Receiver not found', 400));
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user.id,
    receiverId,
    content: content.trim(),
  });

  conversation.lastMessage = content.trim();
  conversation.lastMessageAt = new Date();

  await conversation.save();

  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name avatar role')
    .populate('receiverId', 'name avatar role');

  // Send real-time event if Socket.IO is available
  const io = req.app.get('io');

  if (io) {
    io.to(`user:${receiverId.toString()}`).emit('new_message', {
      message: populatedMessage,
      conversationId: conversation._id.toString(),
    });

    io.to(`user:${req.user.id.toString()}`).emit('message_sent', {
      message: populatedMessage,
      conversationId: conversation._id.toString(),
    });

    io.to(`conversation:${conversation._id.toString()}`).emit(
      'conversation_updated',
      {
        conversationId: conversation._id.toString(),
        lastMessage: content.trim(),
        lastMessageAt: conversation.lastMessageAt,
      }
    );
  }

  res.status(201).json({
    success: true,
    message: populatedMessage,
  });
});
