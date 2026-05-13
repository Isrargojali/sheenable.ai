const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const EmployerProfileSchema = new mongoose.Schema({
  userId:       { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  companyName:  { type: String, required: true, trim: true },
  industry:     { type: String, required: true, index: true },
  description:  { type: String, maxlength: 2000 },
  websiteUrl:   { type: String },
  logoUrl:      { type: String },
  location: {
    city:       String,
    country:    String,
  },
  companySize:  { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'] },
  foundedYear:  { type: Number },
  isVerified:   { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('EmployerProfile', EmployerProfileSchema);
