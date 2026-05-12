const { getDatabase, isMongoConnected } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// User model for routes that don't go through getDatabase() (login, logout, refresh)
const User = require('../models/User');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { firstName, lastName, email, password, role, gender } = req.body;

    // Block anyone self-registering as ADMIN / SUPER_ADMIN
    if (['ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Cannot register as admin.' });
    }

    // Use getDatabase() so it falls back to mockDB when Atlas is unreachable
    const db = getDatabase();
    const UserModel             = db.User             || User;
    const CandidateProfileModel = db.CandidateProfile || require('../models/CandidateProfile');
    const EmployerProfileModel  = db.EmployerProfile  || require('../models/EmployerProfile');

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered.' });

    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const user = await UserModel.create({
      firstName, lastName, email, password, role,
      gender: gender || '',
      otpCode: otp, otpExpiry,
    });

    // Create role-specific profile
    if (role === 'CANDIDATE') await CandidateProfileModel.create({ userId: user._id });
    else if (role === 'EMPLOYER') await EmployerProfileModel.create({ userId: user._id, companyName: 'My Company' });

    // Send OTP email (graceful failure)
    try { await sendOTPEmail(email, firstName, otp); } catch (emailErr) {
      console.warn('⚠ Email service unavailable:', emailErr.message);
    }

    // Always log OTP in dev so you can test without SendGrid
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📧 Dev OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for the verification code.',
      userId: user._id.toString(),
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    });
  } catch (err) {
    console.error('Register error:', err.message);
    next(err);
  }
};

// ─── VERIFY OTP ──────────────────────────────────────────────────────────────
const verifyOTP = async (req, res, next) => {
  try {
    const { userId, code } = req.body;

    const db = getDatabase();
    const UserModel = db.User || User;

    const user = await UserModel.findById(userId).select('+otpCode +otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Account already verified.' });

    // In dev/mock mode allow any 6-digit code
    if (!isMongoConnected()) {
      if (!code || code.length !== 6) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code (must be 6 digits).' });
      }
      console.log(`📧 Dev Mode: accepting OTP ${code} for ${user.email}`);
    } else {
      if (!user.otpCode || user.otpCode !== code) {
        return res.status(400).json({ success: false, message: 'Invalid OTP code.' });
      }
      if (user.otpExpiry < new Date()) {
        return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
      }
    }

    user.isVerified = true;
    user.otpCode    = undefined;
    user.otpExpiry  = undefined;

    const idStr        = user._id.toString();
    const accessToken  = generateAccessToken(idStr);
    const refreshToken = generateRefreshToken(idStr);
    user.refreshToken  = refreshToken;
    await user.save();

    // Send welcome email
    try { await sendWelcomeEmail(user.email, user.firstName, user.role); } catch {}

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id:        user._id.toString(),
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role,
        avatarUrl: user.avatarUrl || '',
        isVerified: true,
      },
    });
  } catch (err) {
    console.error('OTP verification error:', err.message);
    next(err);
  }
};

// ─── LOGIN ───────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { email, password } = req.body;

    const db = getDatabase();
    const UserModel = db.User || User;

    const user = await UserModel.findOne({ email }).select('+password +refreshToken +loginAttempts +lockedUntil');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    // Brute-force lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({
        success: false,
        message: `Account temporarily locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Increment attempts
      const attempts = (user.loginAttempts || 0) + 1;
      const update = { loginAttempts: attempts };
      if (attempts >= 5) {
        update.lockedUntil = new Date(Date.now() + 15 * 60 * 1000); // lock 15 min
      }
      if (UserModel.findByIdAndUpdate) {
        await UserModel.findByIdAndUpdate(user._id, update);
      } else {
        user.loginAttempts = update.loginAttempts;
        if (update.lockedUntil) user.lockedUntil = update.lockedUntil;
        await user.save();
      }
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    if (!user.isVerified) {
      // Resend OTP silently
      const otp = generateOTP();
      const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user.otpCode  = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
      try { await sendOTPEmail(user.email, user.firstName, otp); } catch {}
      if (process.env.NODE_ENV !== 'production') console.log(`📧 Resent Dev OTP for ${user.email}: ${otp}`);
      return res.status(403).json({
        success: false,
        message: 'Please verify your email first. A new OTP has been sent.',
        userId: user._id.toString(),
        ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
      });
    }

    // Successful login — reset lockout state
    user.loginAttempts = 0;
    user.lockedUntil   = undefined;
    user.lastLogin     = new Date();

    const idStr        = user._id.toString();
    const accessToken  = generateAccessToken(idStr);
    const refreshToken = generateRefreshToken(idStr);
    user.refreshToken  = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token: accessToken,
      user: {
        id:        user._id.toString(),
        firstName: user.firstName,
        lastName:  user.lastName,
        email:     user.email,
        role:      user.role,
        avatarUrl: user.avatarUrl || '',
        isVerified: true,
      },
    });
  } catch (err) { next(err); }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }

    const db = getDatabase();
    const UserModel = db.User || User;

    const user = await UserModel.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== token) {
      // Possible token reuse — clear stored token to force re-login
      if (user) {
        user.refreshToken = undefined;
        await user.save();
      }
      return res.status(401).json({ success: false, message: 'Invalid refresh token. Please log in again.' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended.' });
    }

    // Issue new token pair (rotation)
    const idStr           = user._id.toString();
    const newAccessToken  = generateAccessToken(idStr);
    const newRefreshToken = generateRefreshToken(idStr);
    user.refreshToken     = newRefreshToken;
    await user.save();

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({ success: true, token: newAccessToken });
  } catch (err) { next(err); }
};

// ─── RESEND OTP ──────────────────────────────────────────────────────────────
const resendOTP = async (req, res, next) => {
  try {
    const { userId } = req.body;

    const db = getDatabase();
    const UserModel = db.User || User;

    const user = await UserModel.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    if (user.isVerified) return res.status(400).json({ success: false, message: 'Account already verified.' });

    const otp      = generateOTP();
    user.otpCode   = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    try { await sendOTPEmail(user.email, user.firstName, otp); } catch (emailErr) {
      console.warn('⚠ Email service unavailable:', emailErr.message);
    }

    console.log(`📧 Resend OTP for ${user.email}: ${otp}`);

    res.json({
      success: true,
      message: 'A new verification code has been sent to your email.',
      ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
    });
  } catch (err) { next(err); }
};

// ─── LOGOUT ──────────────────────────────────────────────────────────────────
const logout = async (req, res, next) => {
  try {
    const db = getDatabase();
    const UserModel = db.User || User;
    await UserModel.findByIdAndUpdate(req.user._id, { refreshToken: undefined });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

// ─── GET ME ──────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const db = getDatabase();
    const UserModel = db.User || User;
    const user = await UserModel.findById(req.user._id).select('-password -refreshToken -otpCode -otpExpiry');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    // Always return the same message to prevent email enumeration
    const SAFE_RESPONSE = { success: true, message: "If that email exists, a reset link has been sent." };

    const db = getDatabase();
    const UserModel = db.User || User;

    const user = await UserModel.findOne({ email });
    if (!user) return res.json(SAFE_RESPONSE);

    // Generate reset token
    const rawToken   = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    user.passwordResetToken  = hashedToken;
    user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${rawToken}`;
    console.log(`[PASSWORD RESET] ${email} => ${resetLink}`);

    try { await sendPasswordResetEmail(email, resetLink); } catch (emailErr) {
      console.warn('⚠ Email service unavailable:', emailErr.message);
    }

    res.json(SAFE_RESPONSE);
  } catch (err) { next(err); }
};

// ─── RESET PASSWORD ──────────────────────────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and newPassword are required.' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const db = getDatabase();
    const UserModel = db.User || User;

    const user = await UserModel.findOne({
      passwordResetToken:  hashedToken,
      passwordResetExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Reset token is invalid or has expired.' });
    }

    user.password            = newPassword; // bcrypt pre-save hook will hash it
    user.passwordResetToken  = undefined;
    user.passwordResetExpiry = undefined;
    user.loginAttempts       = 0;
    user.lockedUntil         = undefined;
    await user.save();

    res.json({ success: true, message: 'Password reset successful. You can now log in.' });
  } catch (err) { next(err); }
};

module.exports = { register, verifyOTP, login, refreshToken, resendOTP, logout, getMe, forgotPassword, resetPassword };
