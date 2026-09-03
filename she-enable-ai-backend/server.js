require('dotenv').config();
// Fail-fast environment variable validation at startup
const { validateEnv } = require('./src/config/env');
validateEnv();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const mongoose = require('mongoose');

// Local imports
const logger = require('./src/utils/logger');
const { connectDB } = require('./src/config/database');
const errorHandler = require('./src/middleware/errorHandler');
const { generalLimiter } = require('./src/middleware/rateLimiter');
const { initializeSocket } = require('./src/sockets/chatSocket');
const mongoSanitize = require('express-mongo-sanitize');

// Route imports
const authRoutes = require('./src/routes/auth');
const profileRoutes = require('./src/routes/profile');
const jobRoutes = require('./src/routes/jobs');
const applicationRoutes = require('./src/routes/applications');
const adminRoutes = require('./src/routes/admin');
const interviewRoutes = require('./src/routes/interviews');
const messageRoutes = require('./src/routes/messages');
const notificationRoutes = require('./src/routes/notifications');
const uploadRoutes = require('./src/routes/upload');
const aiRoutes = require('./src/routes/ai');
const articleRoutes = require('./src/routes/articles');
const salaryRoutes = require('./src/routes/salaries');
const mentorRoutes = require('./src/routes/mentors');
const eventRoutes = require('./src/routes/events');
const contactRoutes = require('./src/routes/contact');

// Initialize app
const app = express();
const server = http.createServer(app);

// Trust reverse proxy (Nginx, ALB, Cloudflare, Render) for accurate client IP in rate limiters
app.set('trust proxy', 1);

// Connect Database (with MockDB fallback)
connectDB();

// Environment checks
const isProd = process.env.NODE_ENV === 'production';

// Strict CORS config
const extraOrigins = process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',') : [];
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:5173',
  'http://localhost:8080',
  ...extraOrigins
].filter(Boolean);

const corsVerify = (origin, callback) => {
  // Allow requests with no origin (mobile apps, curl, etc.)
  if (!origin) {
    return callback(null, true);
  }

  // In development, allow localhost, 127.0.0.1, and local private network subnets (regardless of port)
  if (process.env.NODE_ENV !== 'production') {
    const isLocal = /^https?:\/\/((localhost|127\.0\.0\.1)|(192\.168\.\d+\.\d+)|(10\.\d+\.\d+\.\d+)|(172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+))(:\d+)?$/.test(origin);
    if (isLocal) {
      return callback(null, true);
    }
  }

  if (allowedOrigins.includes(origin)) {
    callback(null, true);
  } else {
    callback(new Error('Not allowed by CORS'));
  }
};

app.use(cors({
  origin: corsVerify,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Setup Socket.io with strict CORS
const io = new Server(server, {
  cors: {
    origin: corsVerify,
    methods: ['GET', 'POST'],
    credentials: true
  }
});
initializeSocket(io);

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(morgan(isProd ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Sanitize request bodies and query parameters against NoSQL injection
app.use(mongoSanitize({ allowDots: true }));

// Dedicated health endpoint (exempt from general rate limits for load balancers and uptime checks)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));

// Apply rate limiting to all standard application routes
app.use(generalLimiter);

// Serve static uploads folder for local testing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/salaries', salaryRoutes);
app.use('/api/mentors', mentorRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/contact', contactRoutes);

// Error Handling Middleware — must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections and uncaught exceptions with structured logger
process.on('unhandledRejection', (err) => {
  logger.error('CRITICAL: Unhandled Promise Rejection', { error: err?.message, stack: err?.stack });
});

process.on('uncaughtException', (err) => {
  logger.error('FATAL: Uncaught Exception', { error: err?.message, stack: err?.stack });
  // Clean exit for process manager (PM2/Kubernetes) to restart container
  process.exit(1);
});

