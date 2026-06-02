// she-enable-ai-backend/src/models/OtpRateLimit.js
const mongoose = require('mongoose');

const OtpRateLimitSchema = new mongoose.Schema({
  email: { type: String, index: true },
  ip: { type: String, index: true },
  createdAt: { type: Date, default: Date.now, expires: 3600 } // Auto-delete after 1 hour (3600s)
});

module.exports = mongoose.model('OtpRateLimit', OtpRateLimitSchema);
