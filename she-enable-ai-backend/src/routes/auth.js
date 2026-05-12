const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const {
  register, verifyOTP, login, refreshToken, resendOTP,
  logout, getMe, forgotPassword, resetPassword,
} = require('../controllers/authController');
const protect = require('../middleware/auth');

const registerValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/(?=.*[a-z])/).withMessage('Password must contain a lowercase letter')
    .matches(/(?=.*[A-Z])/).withMessage('Password must contain an uppercase letter')
    .matches(/(?=.*\d)/).withMessage('Password must contain a number'),
  body('role').isIn(['CANDIDATE', 'EMPLOYER']).withMessage('Role must be CANDIDATE or EMPLOYER'),
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password is required'),
];

router.post('/register',         registerValidation, register);
router.post('/verify-otp',       verifyOTP);
router.post('/resend-otp',       body('userId').notEmpty().withMessage('userId is required'), resendOTP);
router.post('/login',            loginValidation, login);
router.post('/refresh',          refreshToken);
router.post('/logout',           protect, logout);
router.get('/me',                protect, getMe);
router.post('/forgot-password',  body('email').isEmail().normalizeEmail(), forgotPassword);
router.post('/reset-password',   resetPassword);

module.exports = router;
