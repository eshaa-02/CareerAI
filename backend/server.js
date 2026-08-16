const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const { startReminderCron } = require('./services/interviewReminderService');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // Connect MongoDB
    await connectDB();

    // Create HTTP server
    const server = http.createServer(app);

    // Create ONE Socket.IO server
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
    });

    // Make socket available in controllers
    app.set('io', io);

    // Socket connections
    io.on('connection', (socket) => {
      console.log('Socket connected:', socket.id);

      // Personal user room
      socket.on('join_user', (userId) => {
        if (!userId) return;

        socket.join(`user:${userId}`);

        console.log(`User ${userId} joined user:${userId}`);
      });

      // Conversation room
      socket.on('join_conversation', (conversationId) => {
        if (!conversationId) return;

        socket.join(`conversation:${conversationId}`);

        console.log(
          `Socket ${socket.id} joined conversation:${conversationId}`
        );
      });

      // Leave conversation
      socket.on('leave_conversation', (conversationId) => {
        if (!conversationId) return;

        socket.leave(`conversation:${conversationId}`);

        console.log(
          `Socket ${socket.id} left conversation:${conversationId}`
        );
      });

      // Disconnect
      socket.on('disconnect', (reason) => {
        console.log(
          `Socket disconnected: ${socket.id} - ${reason}`
        );
      });
    });

    // Start reminder service
    startReminderCron();

    // Start server
    server.listen(PORT, () => {
      console.log(
        `CareerAI backend running in ${process.env.NODE_ENV || 'development'
        } mode on port ${PORT}`
      );

      console.log(`Socket.IO running on port ${PORT}`);
    });

    // Handle unexpected errors
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down...');

      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('FAILED TO START BACKEND');
    console.error(error);

    process.exit(1);
  }
}

startServer();