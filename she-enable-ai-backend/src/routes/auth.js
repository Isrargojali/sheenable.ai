const express = require('express');
const router = express.Router();
const { register, verifyOtp, login, refreshToken, logout, forgotPassword, resetPassword, resendOtp, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { loginLimiter, registerLimiter, otpLimiter } = require('../middleware/rateLimiter');

router.post('/register', registerLimiter, register);
router.post('/verify-otp', otpLimiter, verifyOtp);
router.post('/login', loginLimiter, login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/resend-otp', otpLimiter, resendOtp);
router.get('/me', protect, getMe);

module.exports = router;
