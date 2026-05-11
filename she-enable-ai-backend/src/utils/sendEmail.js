// Re-export from emailService for backward compatibility
const { sendOTPEmail, sendApplicationStatusEmail } = require('../services/emailService');
module.exports = { sendOTPEmail, sendApplicationStatusEmail };
