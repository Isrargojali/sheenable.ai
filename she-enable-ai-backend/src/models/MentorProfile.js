const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const MentorProfileSchema = new mongoose.Schema({
  userId:        { type: ObjectId, ref: 'User', required: true, unique: true, index: true },
  title:         { type: String, required: true, trim: true },
  company:       { type: String, required: true, trim: true },
  expertise:     [{ type: String, trim: true, index: true }],
  bio:           { type: String, required: true },
  avatarUrl:     { type: String },
  availability: {
    days:        [{ type: String }],
    hours:       { type: String }
  },
  bookingsCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('MentorProfile', MentorProfileSchema);
