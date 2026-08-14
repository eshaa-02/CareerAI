const express = require('express');
const cors = require('cors');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('path');

const errorHandler = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const candidateRoutes = require('./routes/candidateRoutes');
const companyRoutes = require('./routes/companyRoutes');
const jobRoutes = require('./routes/jobRoutes');
const applicationRoutes = require('./routes/applicationRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const messageRoutes = require('./routes/messageRoutes');
const adminRoutes = require('./routes/adminRoutes');
const employerRoutes = require('./routes/employerRoutes');
const statsRoutes = require('./routes/statsRoutes');
const interviewRoutes = require('./routes/interviewRoutes');

const app = express();

// ============================================================
// Security & Parsing Middleware
// ============================================================

app.use(helmet());

app.use(compression());

app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));

app.use(
  express.urlencoded({
    extended: true,
    limit: '10mb',
  })
);

app.use(cookieParser());

app.use(mongoSanitize());

app.use(xss());

// ============================================================
// Logging
// ============================================================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ============================================================
// API Rate Limiter
// ============================================================

app.use('/api', apiLimiter);

// ============================================================
// Static Files
// ============================================================

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ============================================================
// Health Check
// ============================================================

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'CareerAI API is running',
    timestamp: new Date(),
  });
});

// ============================================================
// API Routes
// ============================================================

app.use('/api/auth', authRoutes);

app.use('/api/users', userRoutes);

app.use('/api/candidates', candidateRoutes);

app.use('/api/companies', companyRoutes);

app.use('/api/jobs', jobRoutes);

app.use('/api/applications', applicationRoutes);

app.use('/api/notifications', notificationRoutes);

app.use('/api/messages', messageRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/employer', employerRoutes);

app.use('/api/stats', statsRoutes);

app.use('/api/interviews', interviewRoutes);

// ============================================================
// 404 Handler
// ============================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
});

// ============================================================
// Global Error Handler
// Must be the LAST middleware
// ============================================================

app.use(errorHandler);

// ============================================================
// Export App
// ============================================================

module.exports = app;