// she-enable-ai-backend/src/middleware/otpRateLimiter.js
const OtpRateLimit = require('../models/OtpRateLimit');
const logger = require('../utils/logger');

const otpRateLimiter = async (req, res, next) => {
  try {
    const email = (req.body.email || req.body.userId || '').toLowerCase().trim();
    const ip = req.ip;

    // 1. Enforce dynamic Hourly Email limit (maximum 5 requests)
    if (email) {
      const emailCount = await OtpRateLimit.countDocuments({ email });
      if (emailCount >= 5) {
        logger.warn('OTP request blocked: Hourly email limit exceeded', { email, ip });
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Please try again later.'
        });
      }
    }

    // 2. Enforce dynamic Hourly IP limit (maximum 10 requests)
    const ipCount = await OtpRateLimit.countDocuments({ ip });
    if (ipCount >= 10) {
      logger.warn('OTP request blocked: Hourly IP limit exceeded', { email, ip });
      return res.status(429).json({
        success: false,
        message: 'Too many OTP requests. Please try again later.'
      });
    }

    // 3. Store OTP Request to MongoDB Rate-Limit log index
    await OtpRateLimit.create({ email, ip });

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = otpRateLimiter;
