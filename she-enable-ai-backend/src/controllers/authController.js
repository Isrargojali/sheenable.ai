const { getDatabase, isMongoConnected } = require('../config/database');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { sendOTPEmail } = require('../services/emailService');
const { validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

// User model for routes that don't go through getDatabase() (login, logout, refresh)
// These always run after MongoDB is confirmed connected (otherwise they 401 anyway)
const User = require('../models/User');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// ─── REGISTER ────────────────────────────────────────────────────────────────
const register = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { firstName, lastName, email, password, role } = req.body;

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

    const user = await UserModel.create({ firstName, lastName, email, password, role, otpCode: otp, otpExpiry });

    // Create role-specific profile
    if (role === 'CANDIDATE') await CandidateProfileModel.create({ userId: user._id });
    else if (role === 'EMPLOYER') await EmployerProfileModel.create({ userId: user._id, companyName: 'My Company' });

    // Send OTP email (graceful failure — registration still succeeds if email fails)
    try {
      await sendOTPEmail(email, firstName, otp);
    } catch (emailErr) {
      console.warn('⚠ Email service unavailable:', emailErr.message);
    }

    // Always log OTP in dev so you can test without SendGrid
    if (!isMongoConnected() || process.env.NODE_ENV !== 'production') {
      console.log(`📧 Dev OTP for ${email}: ${otp}`);
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful. Check your email for the verification code.',
      userId: user._id.toString(),
      // Expose OTP in dev/test so signup flow can be completed without real email
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

    // In dev/mock mode allow any 6-digit code so you can test without real OTP
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

    // Use .toString() so JWT payload contains a plain string ID,
    // not a nested MockObjectId object — this is critical for auth middleware
    const idStr        = user._id.toString();
    const accessToken  = generateAccessToken(idStr);
    const refreshToken = generateRefreshToken(idStr);
    user.refreshToken  = refreshToken;
    await user.save();

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
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

    // FIX 1 — User is now imported at the top of this file (was missing in original)
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }
    if (!user.isVerified) {
      return res.status(403).json({ success: false, message: 'Please verify your email first.' });
    }
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account suspended. Contact support.' });
    }

    user.lastLogin = new Date();

    // Use .toString() for consistent string IDs in JWT payload
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
      },
    });
  } catch (err) { next(err); }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────────────────────
// FIX 9 — Token rotation: every refresh call issues a brand-new refresh token.
// The old token is invalidated, so stolen tokens can't be reused.
const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;
    if (!token) return res.status(401).json({ success: false, message: 'No refresh token.' });

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Refresh token invalid or expired.' });
    }

    const user = await User.findById(decoded.id).select('+refreshToken');
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
    const newAccessToken  = generateAccessToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
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

    try {
      await sendOTPEmail(user.email, user.firstName, otp);
    } catch (emailErr) {
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
    // FIX 1 — User is imported at module top; this no longer crashes
    await User.findByIdAndUpdate(req.user._id, { refreshToken: undefined });
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch (err) { next(err); }
};

module.exports = { register, verifyOTP, login, refreshToken, resendOTP, logout };
