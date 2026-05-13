// This file can be used for centralized email configuration if needed.
// The actual sending logic is in src/utils/sendEmail.js

module.exports = {
  fromEmail: process.env.FROM_EMAIL || 'noreply@sheenableai.com',
  fromName: process.env.FROM_NAME || 'SheEnableAI',
  sendgridApiKey: process.env.SENDGRID_API_KEY,
};
