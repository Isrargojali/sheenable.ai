const mongoose = require('mongoose');

const employerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true, trim: true },
  industry: { type: String, trim: true },
  companySize: { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  website: { type: String, trim: true },
  description: { type: String, maxlength: 2000 },
  logoUrl: { type: String, default: '' },
  logoPublicId: { type: String, default: '' },
  location: { type: String },
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('EmployerProfile', employerProfileSchema);
