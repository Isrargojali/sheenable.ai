const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName:  { type: String, required: [true, 'First name is required'], trim: true, maxlength: 50 },
  lastName:   { type: String, required: [true, 'Last name is required'],  trim: true, maxlength: 50 },
  email:      { type: String, required: [true, 'Email is required'], unique: true, lowercase: true,
                match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] },
  password:   { type: String, required: [true, 'Password is required'], minlength: 8, select: false },
  role:       { type: String, enum: ['CANDIDATE','EMPLOYER','ADMIN','SUPER_ADMIN'], required: true },
  isVerified: { type: Boolean, default: false },
  isActive:   { type: Boolean, default: true },
  avatarUrl:      { type: String, default: '' },
  avatarPublicId: { type: String, default: '' },
  otpCode:        { type: String,  select: false },
  otpExpiry:      { type: Date,    select: false },
  refreshToken:   { type: String,  select: false },
  passwordResetToken: { type: String,  select: false },
  passwordResetExpiry:{ type: Date,    select: false },
  lastLogin:  { type: Date },
}, { timestamps: true }); // adds createdAt and updatedAt automatically

// Hash password BEFORE saving — never store plain text passwords
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next(); // Only hash if password changed
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare entered password with hashed one
userSchema.methods.comparePassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);