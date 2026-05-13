const crypto = require('crypto');

const generateOtp = () => {
  // Generate a 6-digit string
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Hash the OTP using SHA-256
  const hash = crypto.createHash('sha256').update(otp).digest('hex');

  // Expiry time (10 minutes from now)
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  return { otp, hash, expiresAt };
};

module.exports = { generateOtp };
