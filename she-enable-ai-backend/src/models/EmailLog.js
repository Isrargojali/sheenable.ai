// she-enable-ai-backend/src/models/EmailLog.js
const mongoose = require('mongoose');

const EmailLogSchema = new mongoose.Schema({
  email: { type: String, required: true, index: true },
  templateType: { type: String, required: true, index: true },
  provider: { type: String, required: true, index: true }, // 'SENDGRID' or 'SMTP'
  status: { type: String, required: true, default: 'SENT', index: true }, // 'SENT', 'DELIVERED', 'OPENED', 'CLICKED', 'BOUNCED', 'DROPPED'
  messageId: { type: String, index: true },
  metadata: { type: mongoose.Schema.Types.Mixed },
  history: [
    {
      status: String,
      timestamp: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', EmailLogSchema);
