const User = require('../models/User');
const CandidateProfile = require('../models/CandidateProfile');
const EmployerProfile = require('../models/EmployerProfile');
const AuditLog = require('../models/AuditLog');
const { generateTokens, hashToken } = require('../utils/generateTokens');
const { generateOtp } = require('../utils/otpGenerator');
const { sendOTPEmail, sendWelcomeEmail, sendPasswordResetEmail } = require('../services/emailService');
const { success, error } = require('../utils/apiResponse');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const logger = require('../utils/logger');

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
      await sendOTPEmail(user.email, user.firstName, otp);
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

    try {
      await sendWelcomeEmail(user.email, user.firstName, user.role);
    } catch (emailErr) {
      logger.error('Failed to send welcome email during verification', {
        error: emailErr.message,
        userId: user._id,
        email: user.email
      });
    }

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
      try {
        await sendOTPEmail(user.email, user.firstName, otp);
      } catch (emailErr) {
        logger.error('Failed to send OTP email during login', {
          error: emailErr.message,
          userId: user._id,
          email: user.email
        });
      }
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
      await sendOTPEmail(user.email, user.firstName, otp);
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

const googleOAuth = async (req, res, next) => {
  try {
    const { token, isSimulation, simulationData } = req.body;
    let email, firstName, lastName, avatarUrl;

    if (isSimulation || !process.env.GOOGLE_CLIENT_ID) {
      if (!simulationData || !simulationData.email || !simulationData.firstName || !simulationData.lastName) {
        return error(res, 'Simulation data is missing', 400);
      }
      email = simulationData.email.toLowerCase().trim();
      firstName = simulationData.firstName;
      lastName = simulationData.lastName;
      avatarUrl = simulationData.avatarUrl || null;
    } else {
      if (!token) return error(res, 'ID Token is required', 400);
      try {
        const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`);
        if (!googleRes.ok) {
          return error(res, 'Invalid Google ID token', 401);
        }
        const data = await googleRes.json();
        email = data.email.toLowerCase().trim();
        firstName = data.given_name || 'Google';
        lastName = data.family_name || 'User';
        avatarUrl = data.picture || null;
      } catch (err) {
        return error(res, `Google token verification failed: ${err.message}`, 401);
      }
    }

    let user = await User.findOne({ email }).select('+refreshToken');
    let isNewUser = false;

    if (!user) {
      const secureRandomPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      const defaultRole = req.body.role || 'CANDIDATE';
      user = await User.create({
        firstName,
        lastName,
        email,
        password: secureRandomPassword,
        role: defaultRole,
        gender: defaultRole === 'CANDIDATE' ? 'female' : 'prefer-not-to-say',
        isVerified: true
      });

      if (defaultRole === 'CANDIDATE') {
        await CandidateProfile.create({ userId: user._id });
      } else {
        await EmployerProfile.create({ userId: user._id, companyName: `${firstName}'s Company`, industry: 'Other' });
      }
      isNewUser = true;
      await logAudit('USER_REGISTERED_OAUTH', 'user', user._id, user._id);
    } else {
      if (!user.isVerified) {
        user.isVerified = true;
      }
    }

    if (!user.isActive) return error(res, 'Account suspended. Contact support.', 403);

    user.lastLoginAt = Date.now();
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    await logAudit('LOGIN_SUCCESS_OAUTH', 'user', user._id, user._id);

    if (isNewUser) {
      try {
        await sendWelcomeEmail(user.email, user.firstName, user.role);
      } catch (emailErr) {
        console.error('Welcome email failed for OAuth user:', emailErr.message);
      }
    }

    res.cookie('refreshToken', newRefreshToken, {
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

    return success(res, { token: accessToken, user: safeUserObject, isNewUser });
  } catch (err) {
    next(err);
  }
};

const linkedinOAuth = async (req, res, next) => {
  try {
    const { code, isSimulation, simulationData } = req.body;
    let email, firstName, lastName, avatarUrl;

    if (isSimulation || !process.env.LINKEDIN_CLIENT_ID) {
      if (!simulationData || !simulationData.email || !simulationData.firstName || !simulationData.lastName) {
        return error(res, 'Simulation data is missing', 400);
      }
      email = simulationData.email.toLowerCase().trim();
      firstName = simulationData.firstName;
      lastName = simulationData.lastName;
      avatarUrl = simulationData.avatarUrl || null;
    } else {
      if (!code) return error(res, 'Code is required', 400);
      try {
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: `${process.env.FRONTEND_URL}/auth/linkedin/callback`,
            client_id: process.env.LINKEDIN_CLIENT_ID,
            client_secret: process.env.LINKEDIN_CLIENT_SECRET
          })
        });
        if (!tokenRes.ok) return error(res, 'Failed to fetch LinkedIn access token', 401);
        const { access_token } = await tokenRes.json();

        const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` }
        });
        if (!profileRes.ok) return error(res, 'Failed to fetch LinkedIn profile details', 401);
        const data = await profileRes.json();

        email = data.email.toLowerCase().trim();
        firstName = data.given_name || 'LinkedIn';
        lastName = data.family_name || 'User';
        avatarUrl = data.picture || null;
      } catch (err) {
        return error(res, `LinkedIn verification failed: ${err.message}`, 401);
      }
    }

    let user = await User.findOne({ email }).select('+refreshToken');
    let isNewUser = false;

    if (!user) {
      const secureRandomPassword = crypto.randomBytes(16).toString('hex') + 'Aa1!';
      const defaultRole = req.body.role || 'CANDIDATE';
      user = await User.create({
        firstName,
        lastName,
        email,
        password: secureRandomPassword,
        role: defaultRole,
        gender: defaultRole === 'CANDIDATE' ? 'female' : 'prefer-not-to-say',
        isVerified: true
      });

      if (defaultRole === 'CANDIDATE') {
        await CandidateProfile.create({ userId: user._id });
      } else {
        await EmployerProfile.create({ userId: user._id, companyName: `${firstName}'s Company`, industry: 'Other' });
      }
      isNewUser = true;
      await logAudit('USER_REGISTERED_OAUTH', 'user', user._id, user._id);
    } else {
      if (!user.isVerified) {
        user.isVerified = true;
      }
    }

    if (!user.isActive) return error(res, 'Account suspended. Contact support.', 403);

    user.lastLoginAt = Date.now();
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user._id);
    user.refreshToken = hashToken(newRefreshToken);
    await user.save();

    await logAudit('LOGIN_SUCCESS_OAUTH', 'user', user._id, user._id);

    if (isNewUser) {
      try {
        await sendWelcomeEmail(user.email, user.firstName, user.role);
      } catch (emailErr) {
        console.error('Welcome email failed for OAuth user:', emailErr.message);
      }
    }

    res.cookie('refreshToken', newRefreshToken, {
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

    return success(res, { token: accessToken, user: safeUserObject, isNewUser });
  } catch (err) {
    next(err);
  }
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
  getMe,
  googleOAuth,
  linkedinOAuth
};
