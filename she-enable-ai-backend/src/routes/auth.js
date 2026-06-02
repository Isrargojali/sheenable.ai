const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, refreshToken, logout, forgotPassword, resetPassword, resendOtp, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, registerLimiter } = require('../middleware/rateLimiter');
const otpRateLimiter = require('../middleware/otpRateLimiter');

router.post('/register', registerLimiter, register);
router.post('/verify-otp', otpRateLimiter, verifyOtp);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', otpRateLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', otpRateLimiter, resendOtp);
router.get('/me', protect, getMe);

module.exports = router;
