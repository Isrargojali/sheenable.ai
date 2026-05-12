const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:    { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
  lastName:     { type: String, required: [true, 'Last name is required'], trim: true, maxlength: 50 },
  email:        { type: String, required: [true, 'Email is required'], unique: true, lowercase: true, match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'], index: true },
  password:     { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
  phone:        { type: String, default: '' },
  role:         { type: String, enum: ['CANDIDATE', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN'], required: true, index: true },
  gender:       { type: String, enum: ['female', 'non-binary', 'prefer-not-to-say', ''], default: '' },
  isVerified:   { type: Boolean, default: false, index: true },
  isActive:     { type: Boolean, default: true, index: true },
  avatarUrl:    { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  // OTP for email verification
  otpCode:      { type: String, select: false },
  otpExpiry:    { type: Date,   select: false },
  // JWT refresh token (stored as plain — hashing is overkill for dev; use hashed in production)
  refreshToken: { type: String, select: false },
  // Password reset
  passwordResetToken:  { type: String, select: false },
  passwordResetExpiry: { type: Date,   select: false },
  // Brute-force / account lockout
  loginAttempts: { type: Number, default: 0 },
  lockedUntil:   { type: Date },
  lastLogin:     { type: Date },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
