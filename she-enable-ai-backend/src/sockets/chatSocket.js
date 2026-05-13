const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getDatabase } = require('../config/database');

const initializeSocket = (io) => {
  // Use io globally to emit events from controllers
  global.io = io;

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const { User: DbUser } = getDatabase();
      const user = await (DbUser || User).findById(decoded.id).select('+isActive');
      
      if (!user || !user.isActive) {
        return next(new Error('Authentication error: Invalid or inactive user'));
      }

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Authentication error: Token failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] User connected: ${socket.user._id} (${socket.user.role})`);
    
    // Join a personal room named by user ID so we can emit direct messages easily
    socket.join(socket.user._id.toString());

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user._id}`);
    });

    // Optional: client can explicitly join a thread room if they want real-time typing indicators
    socket.on('joinThread', (threadId) => {
      socket.join(`thread_${threadId}`);
    });

    socket.on('leaveThread', (threadId) => {
      socket.leave(`thread_${threadId}`);
    });

    socket.on('typing', ({ threadId, isTyping }) => {
      socket.to(`thread_${threadId}`).emit('userTyping', {
        threadId,
        userId: socket.user._id,
        isTyping
      });
    });
  });
};

module.exports = { initializeSocket };
