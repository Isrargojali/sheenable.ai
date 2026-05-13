const { error } = require('../utils/apiResponse');

const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Server error';

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    message = 'Resource not found';
    statusCode = 400;
  }

  // Mongoose Duplicate key
  if (err.code === 11000) {
    message = 'Duplicate field value entered';
    statusCode = 400;
  }

  // Mongoose ValidationError
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join(', ');
    statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    message = 'Not authorized, token failed';
    statusCode = 401;
  }
  if (err.name === 'TokenExpiredError') {
    message = 'Not authorized, token expired';
    statusCode = 401;
  }

  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }

  // Don't leak exact error details in production unless it's a controlled message
  if (process.env.NODE_ENV === 'production' && statusCode === 500) {
    message = 'Server error';
  }

  error(res, message, statusCode);
};

module.exports = errorHandler;

