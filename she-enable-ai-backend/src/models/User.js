const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
  password: { type: String, required: true, minlength: 8, select: false },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  phone: { type: String, default: null },
  role: { type: String, enum: ['CANDIDATE', 'EMPLOYER', 'ADMIN', 'SUPER_ADMIN'], required: true, index: true },
  gender: { type: String, enum: ['female', 'non-binary', 'prefer-not-to-say'], required: true },
  avatarUrl: { type: String, default: null },
  isVerified: { type: Boolean, default: false, index: true },
  isActive: { type: Boolean, default: true, index: true },
  otp: {
    code: { type: String, select: false },
    expiresAt: { type: Date }
  },
  passwordResetToken: { type: String, select: false },
  passwordResetExpiry: { type: Date },
  refreshToken: { type: String, select: false },   // stores SHA-256 hash
  lastLoginAt: { type: Date },
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: { type: Date },
}, { timestamps: true });

// Pre-save: hash password if modified
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Instance method: compare password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Instance method: check if account is locked
UserSchema.methods.isLocked = function () {
  return this.lockedUntil && this.lockedUntil > Date.now();
};

// Compound indexes for common queries
UserSchema.index({ role: 1, isActive: 1 });
UserSchema.index({ createdAt: -1 });

module.exports = mongoose.model('User', UserSchema);
