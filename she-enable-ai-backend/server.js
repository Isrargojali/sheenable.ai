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

// Initialize app
const app = express();
const server = http.createServer(app);

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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Setup Socket.io with strict CORS
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
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
app.use(generalLimiter);

// Serve static uploads folder for local testing
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/health', (req, res) => res.status(200).json({ status: 'ok', timestamp: new Date() }));
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

// Error Handling Middleware — must be last
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections gracefully
process.on('unhandledRejection', (err, promise) => {
  console.error(`Error: ${err.message}`);
  // In production: server.close(() => process.exit(1));
});
