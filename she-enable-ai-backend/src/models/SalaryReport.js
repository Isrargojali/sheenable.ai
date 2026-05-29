const mongoose = require('mongoose');

const SalaryReportSchema = new mongoose.Schema({
  role:            { type: String, required: true, trim: true, index: true },
  industry:        { type: String, required: true, trim: true, index: true },
  experienceYears: { type: Number, required: true, index: true },
  city:            { type: String, required: true, trim: true, index: true },
  salaryPKR:       { type: Number, required: true },
  gender:          { type: String, enum: ['FEMALE', 'MALE', 'PREFER_NOT_TO_SAY'], default: 'FEMALE', index: true },
  isVerified:      { type: Boolean, default: false, index: true }
}, { timestamps: true });

SalaryReportSchema.index({ role: 1, city: 1, experienceYears: 1 });

module.exports = mongoose.model('SalaryReport', SalaryReportSchema);
