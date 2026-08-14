const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { Conversation, Message } = require('../models/Message');

let ioInstance = null;
// Maps userId (string) -> socketId. In-memory; fine for single-instance
// deployments. For horizontal scaling, back this with Redis pub/sub.
const userSockets = new Map();

function getIO() {
  if (!ioInstance) throw new Error('Socket.io not initialized');
  return ioInstance;
}

function getUserSocketId(userId) {
  return userSockets.get(userId);
}

function initSocket(server) {
  ioInstance = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Authenticate socket connections via JWT
  ioInstance.use((socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error('Invalid authentication token'));
    }
  });

  ioInstance.on('connection', (socket) => {
    userSockets.set(socket.userId, socket.id);
    socket.join(`user:${socket.userId}`);

    socket.emit('connected', { message: 'Socket connected' });

    // Chat: join a conversation room
    socket.on('conversation:join', (conversationId) => {
      socket.join(`conversation:${conversationId}`);
    });

    socket.on('conversation:leave', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Chat: send message
    socket.on('message:send', async (data, callback) => {
      try {
        const { conversationId, receiverId, content } = data;

        let conversation;
        if (conversationId) {
          conversation = await Conversation.findById(conversationId);
        } else {
          conversation = await Conversation.findOne({
            participants: { $all: [socket.userId, receiverId], $size: 2 },
          });
          if (!conversation) {
            conversation = await Conversation.create({
              participants: [socket.userId, receiverId],
              lastMessage: content,
              lastMessageAt: new Date(),
            });
          }
        }

        const message = await Message.create({
          conversationId: conversation._id,
          senderId: socket.userId,
          receiverId,
          content,
        });

        conversation.lastMessage = content;
        conversation.lastMessageAt = new Date();
        await conversation.save();

        ioInstance
          .to(`conversation:${conversation._id}`)
          .emit('message:new', message);

        const receiverSocketId = getUserSocketId(receiverId);
        if (receiverSocketId) {
          ioInstance.to(receiverSocketId).emit('message:new', message);
        }

        if (callback) callback({ success: true, message, conversationId: conversation._id });
      } catch (err) {
        if (callback) callback({ success: false, error: err.message });
      }
    });

    socket.on('typing:start', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:start', { userId });
    });

    socket.on('typing:stop', ({ conversationId, userId }) => {
      socket.to(`conversation:${conversationId}`).emit('typing:stop', { userId });
    });

    socket.on('disconnect', () => {
      if (userSockets.get(socket.userId) === socket.id) {
        userSockets.delete(socket.userId);
      }
    });
  });

  return ioInstance;
}

module.exports = { initSocket, getIO, getUserSocketId };
