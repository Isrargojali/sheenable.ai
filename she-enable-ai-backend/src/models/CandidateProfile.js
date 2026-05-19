const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const CandidateProfileSchema = new mongoose.Schema({
  userId:       { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  cnic:         { type: String, trim: true, sparse: true },
  title:        { type: String, trim: true },
  bio:          { type: String, maxlength: 1000 },
  location: {
    city:       String,
    country:    String,
    remote:     { type: Boolean, default: false }
  },
  category:     { type: String, index: true },
  skills:       [{ name: { type: String, required: true }, level: { type: String, enum: ['beginner','intermediate','advanced','expert'] } }],
  experience: [{
    title:       String, company: String,
    from:        Date,   to: Date,
    current:     { type: Boolean, default: false },
    description: String
  }],
  education: [{
    degree: String, institution: String, year: Number, field: String
  }],
  certifications: [{
    name: String, issuer: String, year: Number, url: String
  }],
  cv: {
    name: String,
    title: String,
    summary: String,
    skills: [String],
    experience: [{
      title: String,
      company: String,
      from: String,
      to: String,
      bullets: [String]
    }],
    education: [{
      degree: String,
      school: String,
      year: String
    }],
    lastUpdated: Date
  },
  cvFileUrl:    String,
  expectedSalary: {
    min:      Number,
    max:      Number,
    currency: { type: String, default: 'USD' }
  },
  yearsOfExperience: Number,
  portfolioUrl: String,
  linkedinUrl:  String,
  githubUrl:    String,
  noticePeriod: { type: String, default: 'Immediate' },
  preferredMode: { type: String, enum: ['REMOTE', 'HYBRID', 'ONSITE'], default: 'REMOTE' },
  languages: [{ type: String, trim: true }],
  isAvailable:  { type: Boolean, default: true, index: true },
  profileViews: { type: Number, default: 0 },
  completionScore: { type: Number, default: 0, min: 0, max: 100 },
}, { timestamps: true });

// Text search index for AI matching
CandidateProfileSchema.index({ 'skills.name': 'text', title: 'text', bio: 'text', category: 'text' });
CandidateProfileSchema.index({ category: 1, isAvailable: 1 });

module.exports = mongoose.model('CandidateProfile', CandidateProfileSchema);
