// she-enable-ai-backend/src/services/emailService.js
const fs = require('fs');
const path = require('path');
const handlebars = require('handlebars');
const SendgridProvider = require('./providers/sendgridProvider');
const SmtpProvider = require('./providers/smtpProvider');
const EmailLog = require('../models/EmailLog');
const logger = require('../utils/logger');
const EmailSendError = require('../errors/EmailSendError');

let activeProvider = null;
let providerName = 'DEVELOPMENT';

// Initialize the active email provider based on environmental variables
try {
  if (process.env.SENDGRID_API_KEY) {
    activeProvider = new SendgridProvider();
    providerName = 'SENDGRID';
  } else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    activeProvider = new SmtpProvider();
    providerName = 'SMTP';
  } else {
    logger.warn('⚠️ No real email provider configured. Dispatches will log to the console only.');
  }
} catch (err) {
  logger.error('Failed to initialize active email provider. Falling back to development console logger.', { error: err.message });
}

/**
 * Loads and compiles a Handlebars template
 * @param {string} templateName 
 * @param {Object} data 
 * @returns {string} Compiled HTML
 */
const compileTemplate = (templateName, data) => {
  const filePath = path.join(__dirname, '../templates', `${templateName}.html`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Email template file not found: ${filePath}`);
  }
  const source = fs.readFileSync(filePath, 'utf-8');
  const template = handlebars.compile(source);
  return template(data);
};

/**
 * Core dispatching agent with exponential backoff retry logic and db logs.
 * @param {Object} options 
 * @param {string} options.to 
 * @param {string} options.subject 
 * @param {string} options.templateType 
 * @param {Object} options.variables 
 * @param {number} retries 
 */
const sendEmail = async (options, retries = 3) => {
  const { to, subject, templateType, variables } = options;
  let html;

  try {
    html = compileTemplate(templateType, variables);
  } catch (err) {
    logger.error('Template compilation failed', { templateType, error: err.message });
    throw new EmailSendError(`Template compilation failed: ${err.message}`);
  }

  // Verification: Validate email before sending
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(to)) {
    logger.error('Email dispatch rejected: Invalid recipient email address', { to });
    throw new EmailSendError('Invalid recipient email address');
  }

  // 🚀 FUTURE SCALABILITY QUEUE INTEGRATION POINT:
  // If integrating BullMQ later, you can push the payload here to the Redis queue instead of executing inline:
  // await emailQueue.add('send-email', { options, retries });
  // and move the below execution block into the Queue Worker thread.

  if (!activeProvider) {
    // Development/Test fallback
    logger.info(`📧 [DEV CONSOLE LOG] Email would be dispatched to: ${to}`, {
      subject,
      templateType,
      variables
    });
    return;
  }

  let lastError;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const messageId = await activeProvider.send({ to, subject, html });

      // Create EmailLog database tracking entry
      await EmailLog.create({
        email: to,
        templateType,
        provider: providerName,
        status: 'SENT',
        messageId,
        metadata: variables,
        history: [{ status: 'SENT' }]
      });

      return;
    } catch (err) {
      lastError = err;
      logger.warn(`Email send attempt ${attempt}/${retries} failed for ${to}`, { error: err.message });
      if (attempt < retries) {
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  // Create failure Log entry
  await EmailLog.create({
    email: to,
    templateType,
    provider: providerName,
    status: 'FAILED',
    metadata: { ...variables, lastError: lastError.message },
    history: [{ status: 'FAILED' }]
  });

  logger.error(`❌ Email delivery permanently failed for ${to} after ${retries} attempts`, { error: lastError.message });
  throw new EmailSendError(`Email delivery failed: ${lastError.message}`);
};

// ─── TRANSACTIONAL DISPATCHERS ────────────────────────────────────────────────

const sendOTPEmail = async (email, firstName, otp) => {
  await sendEmail({
    to: email,
    subject: 'Your SheEnableAI Verification Code',
    templateType: 'otp',
    variables: { firstName, otp }
  });
};

const sendWelcomeEmail = async (email, firstName, role) => {
  const roleLabel = role === 'CANDIDATE' ? 'Job Seeker' : 'Employer';
  const dashboardUrl = role === 'CANDIDATE' 
    ? `${process.env.FRONTEND_URL}/candidate/dashboard`
    : `${process.env.FRONTEND_URL}/employer/dashboard`;

  await sendEmail({
    to: email,
    subject: 'Welcome to SheEnableAI - Your Account is Active!',
    templateType: 'welcome',
    variables: { firstName, role: roleLabel, dashboardUrl }
  });
};

const sendPasswordResetEmail = async (email, resetLink) => {
  await sendEmail({
    to: email,
    subject: 'SheEnableAI - Reset Your Password',
    templateType: 'resetPassword',
    variables: { resetLink }
  });
};

const sendApplicationStatusEmail = async (email, firstName, jobTitle, status, rejectionReason = '') => {
  const statusLabels = {
    SCREENING: 'Under Screening',
    INTERVIEW: 'Shortlisted for Interview',
    OFFERED: 'Job Offered 🎉',
    REJECTED: 'Application Closed'
  };

  await sendEmail({
    to: email,
    subject: `Update on your application for ${jobTitle}`,
    templateType: 'applicationStatus',
    variables: { 
      firstName, 
      jobTitle, 
      status: statusLabels[status] || status, 
      rejectionReason 
    }
  });
};

const sendInterviewScheduledEmail = async (email, firstName, jobTitle, scheduledAt, type, meetingLink) => {
  const typeLabel = { PHONE: 'Phone Call', VIDEO: 'Video Interview', IN_PERSON: 'In-Person' }[type] || type;
  const dateStr = new Date(scheduledAt).toLocaleString('en-US', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' 
  });

  await sendEmail({
    to: email,
    subject: `Interview scheduled: ${jobTitle}`,
    templateType: 'interviewScheduled',
    variables: { firstName, jobTitle, dateStr, typeLabel, meetingLink }
  });
};

module.exports = {
  sendOTPEmail,
  sendWelcomeEmail,
  sendPasswordResetEmail,
  sendApplicationStatusEmail,
  sendInterviewScheduledEmail,
};
