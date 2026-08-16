const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');
const { Conversation, Message } = require('../models/Message');
const User = require('../models/User');
const Company = require('../models/Company');

/*
|--------------------------------------------------------------------------
| GET CONVERSATIONS
|--------------------------------------------------------------------------
*/
exports.getConversations = asyncHandler(async (req, res) => {
  const conversations = await Conversation.find({
    participants: req.user.id,
  })
    .populate('participants', 'name avatar role')
    .sort({ lastMessageAt: -1 });

  const result = await Promise.all(
    conversations.map(async (conversation) => {
      const unreadCount = await Message.countDocuments({
        conversationId: conversation._id,
        receiverId: req.user.id,
        read: false,
      });

      const data = conversation.toObject();

      // Current user ko remove karke jis person se chat ho rahi hai
      // usko first position par rakho.
      const otherParticipant = data.participants.find(
        (participant) =>
          participant._id.toString() !== req.user.id.toString()
      );

      const currentUser = data.participants.find(
        (participant) =>
          participant._id.toString() === req.user.id.toString()
      );

      return {
        ...data,
        participants: otherParticipant
          ? [otherParticipant, currentUser].filter(Boolean)
          : data.participants,
        unreadCount,
      };
    })
  );

  res.status(200).json({
    success: true,
    conversations: result,
  });
});

/*
|--------------------------------------------------------------------------
| SEARCH USERS + COMPANIES
|--------------------------------------------------------------------------
*/
exports.searchMessagesUsers = asyncHandler(async (req, res) => {
  const search = (req.query.q || '').trim();

  if (!search || search.length < 2) {
    return res.status(200).json({
      success: true,
      users: [],
      companies: [],
    });
  }

  const regex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  /*
   * Search candidates and employers.
   *
   * Admins are excluded because they shouldn't normally
   * appear as messaging contacts.
   */
  const users = await User.find({
    _id: { $ne: req.user.id },
    role: { $in: ['candidate', 'employer'] },
    isActive: true,
    isSuspended: false,
    name: regex,
  })
    .select('name email avatar role location')
    .limit(20)
    .lean();

  /*
   * Search actual Company collection.
   *
   * ownerId is the employer/user who owns the company.
   */
  const companies = await Company.find({
    name: regex,
  })
    .populate('ownerId', 'name email avatar role isActive isSuspended')
    .select('name logo industry location description ownerId verified')
    .limit(20)
    .lean();

  /*
   * Remove companies whose owner cannot receive messages.
   */
  const validCompanies = companies.filter((company) => {
    if (!company.ownerId) return false;

    if (company.ownerId._id.toString() === req.user.id.toString()) {
      return false;
    }

    if (company.ownerId.isActive === false) {
      return false;
    }

    if (company.ownerId.isSuspended === true) {
      return false;
    }

    return true;
  });

  res.status(200).json({
    success: true,
    users,
    companies: validCompanies,
  });
});

/*
|--------------------------------------------------------------------------
| GET MESSAGES
|--------------------------------------------------------------------------
*/
exports.getMessages = asyncHandler(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(
      new ErrorResponse('Conversation not found', 404)
    );
  }

  const isParticipant = conversation.participants.some(
    (id) => id.toString() === req.user.id.toString()
  );

  if (!isParticipant) {
    return next(
      new ErrorResponse('Not authorized', 403)
    );
  }

  const messages = await Message.find({
    conversationId: conversation._id,
  })
    .populate('senderId', 'name avatar role')
    .populate('receiverId', 'name avatar role')
    .sort({ createdAt: 1 });

  await Message.updateMany(
    {
      conversationId: conversation._id,
      receiverId: req.user.id,
      read: false,
    },
    {
      $set: { read: true },
    }
  );

  res.status(200).json({
    success: true,
    messages,
  });
});

/*
|--------------------------------------------------------------------------
| START / GET CONVERSATION
|--------------------------------------------------------------------------
*/
exports.startConversation = asyncHandler(async (req, res, next) => {
  const { participantId } = req.body;

  if (!participantId) {
    return next(
      new ErrorResponse(
        'participantId is required',
        400
      )
    );
  }

  if (participantId.toString() === req.user.id.toString()) {
    return next(
      new ErrorResponse(
        'You cannot start a conversation with yourself',
        400
      )
    );
  }

  const participant = await User.findById(participantId)
    .select('name avatar role isActive isSuspended');

  if (!participant) {
    return next(
      new ErrorResponse(
        'User not found',
        404
      )
    );
  }

  if (participant.isActive === false || participant.isSuspended === true) {
    return next(
      new ErrorResponse(
        'This user cannot receive messages',
        400
      )
    );
  }

  let conversation = await Conversation.findOne({
    participants: {
      $all: [req.user.id, participantId],
    },
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [
        req.user.id,
        participantId,
      ],
      lastMessage: '',
      lastMessageAt: new Date(),
    });
  }

  await conversation.populate(
    'participants',
    'name avatar role'
  );

  res.status(200).json({
    success: true,
    conversation,
  });
});

/*
|--------------------------------------------------------------------------
| SEND MESSAGE
|--------------------------------------------------------------------------
*/
exports.sendMessage = asyncHandler(async (req, res, next) => {
  const { content } = req.body;

  if (!content || !content.trim()) {
    return next(
      new ErrorResponse(
        'Message content is required',
        400
      )
    );
  }

  const conversation = await Conversation.findById(
    req.params.id
  );

  if (!conversation) {
    return next(
      new ErrorResponse(
        'Conversation not found',
        404
      )
    );
  }

  const isParticipant = conversation.participants.some(
    (id) =>
      id.toString() === req.user.id.toString()
  );

  if (!isParticipant) {
    return next(
      new ErrorResponse(
        'Not authorized',
        403
      )
    );
  }

  const receiverId = conversation.participants.find(
    (id) =>
      id.toString() !== req.user.id.toString()
  );

  if (!receiverId) {
    return next(
      new ErrorResponse(
        'Receiver not found',
        400
      )
    );
  }

  const message = await Message.create({
    conversationId: conversation._id,
    senderId: req.user.id,
    receiverId,
    content: content.trim(),
  });

  await Conversation.findByIdAndUpdate(
    conversation._id,
    {
      lastMessage: message.content,
      lastMessageAt: message.createdAt,
    }
  );

  await message.populate(
    'senderId',
    'name avatar role'
  );

  await message.populate(
    'receiverId',
    'name avatar role'
  );

  const io = req.app.get('io');

  if (io) {
    io.to(`user:${receiverId.toString()}`).emit(
      'new_message',
      {
        message,
        conversationId: conversation._id.toString(),
      }
    );

    io.to(`user:${req.user.id.toString()}`).emit(
      'message_sent',
      {
        message,
        conversationId: conversation._id.toString(),
      }
    );

    io.to(`user:${receiverId.toString()}`).emit(
      'conversation_updated',
      {
        conversationId: conversation._id.toString(),
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
      }
    );

    io.to(`user:${req.user.id.toString()}`).emit(
      'conversation_updated',
      {
        conversationId: conversation._id.toString(),
        lastMessage: message.content,
        lastMessageAt: message.createdAt,
      }
    );
  }

  res.status(201).json({
    success: true,
    message,
  });
});