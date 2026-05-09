const express = require('express');
const dotenv  = require('dotenv');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');
const cookieParser = require('cookie-parser');
const http    = require('http');
const { Server } = require('socket.io');

// Load .env FIRST — before anything else
dotenv.config();

const connectDB      = require('./src/config/db');
const errorHandler   = require('./src/middleware/errorHandler');
const { loginLimiter, globalLimiter } = require('./src/middleware/rateLimiter');

// Route imports
const authRoutes         = require('./src/routes/auth');
const profileRoutes      = require('./src/routes/profile');
const jobRoutes          = require('./src/routes/jobs');
const applicationRoutes  = require('./src/routes/applications');
const messageRoutes      = require('./src/routes/messages');
const interviewRoutes    = require('./src/routes/interviews');
const uploadRoutes       = require('./src/routes/upload');
const notificationRoutes = require('./src/routes/notifications');
const adminRoutes        = require('./src/routes/admin');

// Connect to MongoDB
connectDB();

const app    = express();
const server = http.createServer(app); // Wrap express in http server for Socket.io

// ─── SECURITY MIDDLEWARE ─────────────────────────────────────────────────────
app.use(helmet());         // Sets secure HTTP headers. One line = dozens of protections.
app.use(globalLimiter);    // Max 100 requests per 15 min per IP

// ─── CORS ────────────────────────────────────────────────────────────────────
// Only allow requests from your React frontend — nobody else
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,           // Allow cookies to be sent
  methods: ['GET','POST','PUT','DELETE','PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ─── BODY PARSING ────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));          // Parse JSON — limit size to prevent attacks
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());                           // Parse cookies (for refresh tokens)

// ─── LOGGING ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Logs every request in terminal — invaluable for debugging
}

// ─── HEALTH CHECK ────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── ROUTES ──────────────────────────────────────────────────────────────────
app.use('/api/auth',          loginLimiter, authRoutes);   // Extra rate limiting on auth
app.use('/api/profile',       profileRoutes);
app.use('/api/jobs',          jobRoutes);
app.use('/api/applications',  applicationRoutes);
app.use('/api/messages',      messageRoutes);
app.use('/api/interviews',    interviewRoutes);
app.use('/api/upload',        uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin',         adminRoutes);

// ─── 404 HANDLER ─────────────────────────────────────────────────────────────
app.use('*', (req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────────────────────
// Must be LAST. Catches any error thrown anywhere in the app.
app.use(errorHandler);

// ─── SOCKET.IO ───────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Make io accessible in controllers via req.app.get('io')
app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on('join-room', (userId) => {
    socket.join(userId); // Each user joins their own private room
    console.log(`User ${userId} joined their room`);
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// ─── START SERVER ────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections — prevents silent crashes
process.on('unhandledRejection', (err) => {
  console.error(`💥 Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});