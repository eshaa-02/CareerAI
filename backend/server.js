const dotenv = require('dotenv');
dotenv.config();

const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSocket } = require('./socket');
const { startReminderCron } = require('./services/interviewReminderService');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect MongoDB first
    await connectDB();

    // Create ONE HTTP server
    const server = http.createServer(app);

    // Initialize ONE Socket.IO instance
    initSocket(server);

    // Start interview reminder service
    startReminderCron();

    // Start server
    server.listen(PORT, () => {
      console.log(
        `CareerAI backend running in ${process.env.NODE_ENV || 'development'
        } mode on port ${PORT}`
      );
      console.log(`API: http://localhost:${PORT}/api`);
      console.log(`Socket.IO: http://localhost:${PORT}`);
    });

    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);

      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');

      server.close(() => {
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('Failed to start CareerAI backend:', error);
    process.exit(1);
  }
};

startServer();