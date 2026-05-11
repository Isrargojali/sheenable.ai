const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * protect — verifies JWT and attaches req.user
 * Works with both real MongoDB and the in-memory mockDB so that
 * development works even when Atlas is unreachable.
 */
const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized. No token.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Use getDatabase() so mock users are found when MongoDB is offline
    const db        = getDatabase();
    const UserModel = db.User || require('../models/User');

    req.user = await UserModel.findById(decoded.id).select('-password');
    if (!req.user)        return res.status(401).json({ success: false, message: 'User no longer exists.' });
    if (!req.user.isActive) return res.status(403).json({ success: false, message: 'Account suspended.' });

    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token is invalid or expired.' });
  }
};

module.exports = protect;
