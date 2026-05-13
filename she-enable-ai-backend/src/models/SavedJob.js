const mongoose = require('mongoose');
const { ObjectId } = mongoose.Schema.Types;

const SavedJobSchema = new mongoose.Schema({
  candidateId: { type: ObjectId, ref: 'User', required: true, index: true },
  jobId: { type: ObjectId, ref: 'Job', required: true },
}, { timestamps: true });

SavedJobSchema.index({ candidateId: 1, jobId: 1 }, { unique: true });

module.exports = mongoose.model('SavedJob', SavedJobSchema);
