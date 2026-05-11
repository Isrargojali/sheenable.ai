const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

/**
 * optionalAuth — same as protect but doesn't block unauthenticated requests.
 * Attaches req.user if a valid token is present, otherwise req.user = null.
 * Works with both real MongoDB and mockDB.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded   = jwt.verify(token, process.env.JWT_SECRET);
      const db        = getDatabase();
      const UserModel = db.User || require('../models/User');
      req.user        = await UserModel.findById(decoded.id).select('-password');
    }
  } catch {
    req.user = null;
  }
  next();
};

module.exports = optionalAuth;
