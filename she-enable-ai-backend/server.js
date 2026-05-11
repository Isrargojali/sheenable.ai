const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');

dotenv.config();

const connectDB = require('./src/config/db');
const errorHandler = require('./src/middleware/errorHandler');
const { globalLimiter } = require('./src/middleware/rateLimiter');

const authRoutes = require('./src/routes/auth');
const jobRoutes = require('./src/routes/jobs');
const applicationRoutes = require('./src/routes/applications');
const messageRoutes = require('./src/routes/messages');
const profileRoutes = require('./src/routes/profile');
const interviewRoutes = require('./src/routes/interviews');
const uploadRoutes = require('./src/routes/upload');
const notificationRoutes = require('./src/routes/notifications');
const adminRoutes = require('./src/routes/admin');

connectDB();

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(globalLimiter);

// FIX 2 — Build an explicit origin allowlist; never allow all in production
const ALLOWED_ORIGINS = [
  process.env.FRONTEND_URL,
  ...(process.env.EXTRA_ORIGINS ? process.env.EXTRA_ORIGINS.split(',') : []),
  // Allow localhost variants only in non-production
  ...(process.env.NODE_ENV !== 'production'
    ? [
        'http://localhost:8080',  // Vite default for this project (vite.config.ts port: 8080)
        'http://localhost:5173',  // Vite generic default
        'http://localhost:3000',  // CRA / Next.js default
        'http://127.0.0.1:8080',
        'http://127.0.0.1:5173',
      ]
    : []),
].filter(Boolean); // remove undefined/empty values

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (Postman, mobile apps, SSR, curl)
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

app.use(errorHandler);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 60000,
});

app.set('io', io);

const onlineUsers = new Map();

io.use(async (socket, next) => {
  try {
    const jwt = require('jsonwebtoken');
    const User = require('./src/models/User');
    const token = socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(new Error('Authentication required'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('firstName lastName role avatarUrl isActive');
    if (!user || !user.isActive) return next(new Error('User not found'));
    socket.user = user;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user._id.toString();
  console.log(`Socket connected: ${socket.user.firstName} (${socket.id})`);

  socket.join(userId);

  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);
  socket.broadcast.emit('user-online', { userId });

  socket.on('send-message', async (data, callback) => {
    try {
      const { threadId, content } = data;
      if (!content?.trim() || !threadId) return callback?.({ error: 'threadId and content required' });
      const Thread = require('./src/models/Thread');
      const Message = require('./src/models/Message');
      const thread = await Thread.findById(threadId);
      if (!thread) return callback?.({ error: 'Thread not found' });
      const isParticipant = thread.candidateId.toString() === userId || thread.employerId.toString() === userId;
      if (!isParticipant) return callback?.({ error: 'Access denied' });
      const message = await Message.create({ threadId, senderId: socket.user._id, content: content.trim() });
      const recipientId = thread.candidateId.toString() === userId ? thread.employerId.toString() : thread.candidateId.toString();
      const isCandidate = socket.user.role === 'CANDIDATE';
      const unreadField = isCandidate ? 'unreadEmployer' : 'unreadCandidate';
      await Thread.findByIdAndUpdate(threadId, { lastMessage: content.trim().substring(0, 100), lastMessageAt: new Date(), lastSenderId: socket.user._id, $inc: { [unreadField]: 1 } });
      const payload = { _id: message._id, threadId, senderId: { _id: socket.user._id, firstName: socket.user.firstName, lastName: socket.user.lastName, avatarUrl: socket.user.avatarUrl, role: socket.user.role }, content: content.trim(), isRead: false, createdAt: message.createdAt };
      io.to(recipientId).emit('new-message', payload);
      socket.to(userId).emit('new-message', payload);
      io.to(recipientId).emit('unread-update', { threadId });
      callback?.({ success: true, message: payload });
    } catch (err) {
      callback?.({ error: 'Failed to send message' });
    }
  });

  socket.on('typing-start', async ({ threadId }) => {
    try {
      const Thread = require('./src/models/Thread');
      const thread = await Thread.findById(threadId).select('candidateId employerId');
      if (!thread) return;
      const recipientId = thread.candidateId.toString() === userId ? thread.employerId.toString() : thread.candidateId.toString();
      io.to(recipientId).emit('user-typing', { threadId, userId, name: socket.user.firstName });
    } catch {}
  });

  socket.on('typing-stop', async ({ threadId }) => {
    try {
      const Thread = require('./src/models/Thread');
      const thread = await Thread.findById(threadId).select('candidateId employerId');
      if (!thread) return;
      const recipientId = thread.candidateId.toString() === userId ? thread.employerId.toString() : thread.candidateId.toString();
      io.to(recipientId).emit('user-stopped-typing', { threadId, userId });
    } catch {}
  });

  socket.on('mark-read', async ({ threadId }) => {
    try {
      const Thread = require('./src/models/Thread');
      const Message = require('./src/models/Message');
      const thread = await Thread.findById(threadId);
      if (!thread) return;
      const unreadField = socket.user.role === 'CANDIDATE' ? 'unreadCandidate' : 'unreadEmployer';
      await Thread.findByIdAndUpdate(threadId, { [unreadField]: 0 });
      await Message.updateMany({ threadId, senderId: { $ne: socket.user._id }, isRead: false }, { isRead: true, readAt: new Date() });
      const recipientId = thread.candidateId.toString() === userId ? thread.employerId.toString() : thread.candidateId.toString();
      io.to(recipientId).emit('messages-read', { threadId, readBy: userId });
    } catch {}
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.user.firstName}`);
    const userSockets = onlineUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socket.id);
      if (userSockets.size === 0) {
        onlineUsers.delete(userId);
        socket.broadcast.emit('user-offline', { userId });
      }
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
