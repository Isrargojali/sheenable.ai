const mongoose = require('mongoose');

const candidateProfileSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  title:     { type: String, trim: true, maxlength: 100 },
  bio:       { type: String, maxlength: 1000 },
  location:  { type: String, trim: true },
  category:  { type: String, trim: true },
  skills:    [{ name: String, proficiency: { type: String, enum: ['Beginner','Intermediate','Expert'] } }],
  expectedSalaryMin: { type: Number },
  expectedSalaryMax: { type: Number },
  yearsOfExperience: { type: Number, default: 0 },
  isAvailable:       { type: Boolean, default: true },
  linkedinUrl:  { type: String, trim: true },
  portfolioUrl: { type: String, trim: true },
  cvUrl:        { type: String, default: '' },
  cvPublicId:   { type: String, default: '' },
  education: [{
    institution: String,
    degree:      String,
    field:       String,
    startYear:   Number,
    endYear:     Number,
  }],
  experience: [{
    company:   String,
    position:  String,
    startDate: Date,
    endDate:   Date,
    current:   { type: Boolean, default: false },
    description: String,
  }],
  certifications: [{ name: String, issuer: String, year: Number }],
  profileCompletionScore: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('CandidateProfile', candidateProfileSchema);