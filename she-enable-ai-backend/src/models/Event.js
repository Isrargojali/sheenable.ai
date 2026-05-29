const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const EventSchema = new mongoose.Schema({
  title:        { type: String, required: true, trim: true },
  description:  { type: String, required: true },
  dateTime:     { type: Date, required: true, index: true },
  format:       { type: String, enum: ['ONLINE', 'IN_PERSON'], required: true, index: true },
  location:     { type: String, required: true }, // Zoom link or physical location
  speakers: [{
    name:       { type: String, required: true },
    role:       { type: String },
    avatarUrl:  { type: String }
  }],
  coverUrl:     { type: String },
  registrations: [{ type: ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
