const mongoose = require('mongoose');

const AdminInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // crypto.randomBytes(32).toString('hex') — stored as SHA-256 hash
    tokenHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['ADMIN', 'SUPER_ADMIN'],
      default: 'ADMIN',
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Auto-delete used or expired invites after 30 days
AdminInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

module.exports = mongoose.model('AdminInvite', AdminInviteSchema);