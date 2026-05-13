const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = getDatabase();

    const user = await User.findById(decoded.id).select('+isActive');
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or suspended' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return next();
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { User } = getDatabase();

    const user = await User.findById(decoded.id).select('+isActive');
    if (user && user.isActive) {
      req.user = user;
    }
  } catch (error) {
    // Ignore error, just proceed without user
  }
  next();
};

module.exports = { protect, optionalAuth };
