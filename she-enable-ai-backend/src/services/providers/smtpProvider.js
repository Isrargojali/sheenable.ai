// she-enable-ai-backend/src/services/providers/smtpProvider.js
const nodemailer = require('nodemailer');
const EmailProvider = require('./emailProvider');
const ProviderUnavailableError = require('../../errors/ProviderUnavailableError');
const logger = require('../../utils/logger');

class SmtpProvider extends EmailProvider {
  constructor() {
    super();
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error('EMAIL_USER or EMAIL_PASS environment variables are missing for SMTP provider.');
    }
    
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async send(options) {
    try {
      const mailOptions = {
        from: `${process.env.FROM_NAME || 'SheEnableAI'} <${process.env.FROM_EMAIL}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
      };

      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email successfully dispatched via SMTP to ${options.to}`, { messageId: info.messageId });
      return info.messageId;
    } catch (err) {
      logger.error(`SMTP transport dispatch failed for ${options.to}`, { error: err.message });
      throw new ProviderUnavailableError(`SMTP provider failed: ${err.message}`, 'SMTP');
    }
  }
}

module.exports = SmtpProvider;
