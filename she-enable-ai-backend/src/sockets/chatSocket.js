const jwt = require('jsonwebtoken');
const User = require('../models/User');

const initializeSocket = (io) => {
  // Use io globally to emit events from controllers
  global.io = io;

  // Track online users in memory (userId -> Set of socketIds)
  const onlineUsers = new Map();

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.token;
      if (!token) return next(new Error('Authentication error: No token'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      const user = await User.findById(decoded.id).select('+isActive');

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
    const userIdStr = socket.user._id.toString();
    socket.join(userIdStr);

    // Track online status
    if (!onlineUsers.has(userIdStr)) {
      onlineUsers.set(userIdStr, new Set());
      // Broadcast that this user is now online
      io.emit('user-online', userIdStr);
    }
    onlineUsers.get(userIdStr).add(socket.id);

    // Send the current online users to the newly connected user
    socket.emit('online-users', Array.from(onlineUsers.keys()));

    socket.on('disconnect', () => {
      console.log(`[Socket] User disconnected: ${socket.user._id}`);
      const userSockets = onlineUsers.get(userIdStr);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          onlineUsers.delete(userIdStr);
          io.emit('user-offline', userIdStr);
        }
      }
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
