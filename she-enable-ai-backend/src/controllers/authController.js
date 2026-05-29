const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const AuditLog = require('../models/AuditLog');
const { generateTokens, hashToken } = require('../utils/generateTokens');
const { generateOtp } = require('../utils/otpGenerator');
const { sendOtpEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../utils/sendEmail');
const { success, error } = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const logAudit = async (action, resourceType, resourceId, userId = null) => {
  try {
    await AuditLog.create({ action, resourceType, resourceId, userId });
  } catch (err) {
    console.error('AuditLog error:', err.message);
  }
};

const register = async (req, res, next) => {
  try {
    const { email, password, firstName, lastName, role, gender } = req.body;

    if (!email || !password || !firstName || !lastName || !role || !gender) {
      return error(res, 'All fields are required', 400);
    }
    if (password.length < 8) return error(res, 'Password must be at least 8 characters', 400);
    if (!['CANDIDATE', 'EMPLOYER'].includes(role)) {
      return error(res, 'Role must be CANDIDATE or EMPLOYER', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return error(res, 'Email already registered', 400);

    const { otp, hash, expiresAt } = generateOtp();

    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role,
      gender,
      otp: { code: hash, expiresAt }
    });

    if (role === 'CANDIDATE') {
      await CandidateProfile.create({ userId: user._id });
    } else {
      await EmployerProfile.create({ userId: user._id, companyName: `${firstName}'s Company`, industry: 'Other' });
    }

    try {
      await sendOtpEmail(user.email, user.firstName, otp);
    } catch (emailErr) {
      console.error('⚠️ OTP email failed, but user was created:', emailErr.message);
      // Don't fail signup if email fails - allow manual resend
    }
    
    await logAudit('USER_REGISTERED', 'user', user._id, user._id);

    return res.status(201).json({
      success: true,
      userId: user._id,
      message: 'Account created! Check your email for the verification code. If you don\'t see it, click "Resend Code".',
      devOtp: process.env.NODE_ENV === 'development' ? otp : undefined
    });
  } catch (err) { next(err); }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { userId, code } = req.body;
    if (!userId || !code) return error(res, 'UserId and code are required', 400);

    const user = await User.findById(userId).select('+otp.code +otp.expiresAt');
    if (!user) return error(res, 'User not found', 404);
    if (user.isVerified) return error(res, 'Account already verified', 400);

    const codeHash = crypto.createHash('sha256').update(code).digest('hex');
    const inputBuffer = Buffer.from(codeHash);
    const dbBuffer = Buffer.from(user.otp.code);
    if (inputBuffer.length !== dbBuffer.length || !crypto.timingSafeEqual(inputBuffer, dbBuffer)) {
      return error(res, 'Invalid verification code', 400);
    }
    if (user.otp.expiresAt < new Date()) return error(res, 'Verification code expired', 400);

    user.isVerified = true;
    user.otp = undefined;
    user.loginAttempts = 0;

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    await sendWelcomeEmail(user.email, user.firstName, user.role);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    const safeUserObject = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified
    };

    return success(res, { token: accessToken, user: safeUserObject });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Email and password are required', 400);

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken +loginAttempts +lockedUntil');
    if (!user) return error(res, 'Invalid credentials', 401);

    if (!user.isActive) return error(res, 'Account suspended. Contact support.', 403);

    if (user.isLocked()) {
      return error(res, `Account locked until ${user.lockedUntil.toLocaleString()}`, 429);
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();
      await logAudit('LOGIN_FAILED', 'user', user._id, user._id);
      return error(res, 'Invalid credentials', 401);
    }

    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLoginAt = Date.now();

    if (!user.isVerified) {
      const { otp, hash, expiresAt } = generateOtp();
      user.otp = { code: hash, expiresAt };
      await user.save();
      await sendOtpEmail(user.email, user.firstName, otp);
      return error(res, 'Please verify your email first', 403);
    }

    const { accessToken, refreshToken } = generateTokens(user._id);
    user.refreshToken = hashToken(refreshToken);
    await user.save();

    await logAudit('LOGIN_SUCCESS', 'user', user._id, user._id);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const safeUserObject = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified
    };

    return success(res, { token: accessToken, user: safeUserObject });
  } catch (err) { next(err); }
};

const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken || req.body.refreshToken;
    if (!token) return error(res, 'Refresh token required', 401);

    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user) return error(res, 'User not found', 401);

    if (hashToken(token) !== user.refreshToken) {
      // Token reuse detected!
      user.refreshToken = undefined;
      await user.save();
      return error(res, 'Session invalidated due to suspicious activity', 401);
    }

    const newTokens = generateTokens(user._id);
    user.refreshToken = hashToken(newTokens.refreshToken);
    await user.save();

    res.cookie('refreshToken', newTokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return success(res, { token: newTokens.accessToken });
  } catch (err) {
    return error(res, 'Invalid refresh token', 401);
  }
};

const logout = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
    await logAudit('LOGOUT', 'user', req.user._id, req.user._id);
    
    res.clearCookie('refreshToken');
    return success(res, null, 'Logged out successfully');
  } catch (err) { next(err); }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return error(res, 'Email is required', 400);

    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      try {
        const rawToken = crypto.randomBytes(32).toString('hex');
        const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
        
        user.passwordResetToken = hashed;
        user.passwordResetExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        const resetLink = `${process.env.FRONTEND_URL}/auth/reset-password?token=${rawToken}`;
        await sendPasswordResetEmail(user.email, resetLink);
        
        console.log(`✅ Password reset email sent to ${user.email}`);
      } catch (emailErr) {
        console.error('⚠️ Failed to send password reset email:', emailErr.message);
        // Don't throw - allow user to try resend or contact support
      }
    }

    // Always return success (for security - don't reveal if email exists)
    return success(res, null, 'If that email is registered, a password reset link has been sent');
  } catch (err) { next(err); }
};

const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return error(res, 'Token and new password required', 400);

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpiry: { $gt: Date.now() } });
    
    if (!user) return error(res, 'Reset link is invalid or has expired', 400);

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    user.lockedUntil = undefined;
    user.loginAttempts = 0;
    await user.save();

    return success(res, null, 'Password reset successful. Please log in.');
  } catch (err) { next(err); }
};

const resendOtp = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) return error(res, 'UserId required', 400);

    const user = await User.findById(userId);
    if (!user) return error(res, 'User not found', 404);
    if (user.isVerified) return error(res, 'Account already verified', 400);

    const { otp, hash, expiresAt } = generateOtp();
    user.otp = { code: hash, expiresAt };
    await user.save();

    try {
      await sendOtpEmail(user.email, user.firstName, otp);
      console.log(`✅ Resent OTP to ${user.email}`);
    } catch (emailErr) {
      console.error('⚠️ Failed to send OTP email:', emailErr.message);
      // Don't fail the request if email fails in dev mode
      if (process.env.NODE_ENV === 'production') {
        throw emailErr;
      }
    }

    return success(res, { 
      message: 'Verification code sent to your email',
      devOtp: process.env.NODE_ENV === 'development' ? otp : undefined 
    });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) return error(res, 'User not found', 404);
    
    const safeUserObject = {
      id: user._id,
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      isVerified: user.isVerified
    };

    return success(res, safeUserObject);
  } catch (err) { next(err); }
};

module.exports = {
  register,
  verifyOtp,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  resendOtp,
  getMe
};
