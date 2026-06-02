// she-enable-ai-backend/src/services/providers/sendgridProvider.js
const sgMail = require('@sendgrid/mail');
const EmailProvider = require('./emailProvider');
const ProviderUnavailableError = require('../../errors/ProviderUnavailableError');
const logger = require('../../utils/logger');

class SendgridProvider extends EmailProvider {
  constructor() {
    super();
    if (!process.env.SENDGRID_API_KEY) {
      throw new Error('SENDGRID_API_KEY environment variable is missing.');
    }
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  }

  async send(options) {
    try {
      const msg = {
        to: options.to,
        from: {
          email: process.env.FROM_EMAIL,
          name: process.env.FROM_NAME || 'SheEnableAI'
        },
        subject: options.subject,
        html: options.html,
      };

      const [response] = await sgMail.send(msg);
      
      // SendGrid returns headers including message ID inside `x-message-id`
      const messageId = response?.headers?.['x-message-id'] || `sg_${Date.now()}`;
      logger.info(`Email successfully dispatched via SendGrid to ${options.to}`, { messageId });
      return messageId;
    } catch (err) {
      logger.error(`SendGrid API dispatch failed for ${options.to}`, { error: err.message });
      throw new ProviderUnavailableError(`SendGrid provider failed: ${err.message}`, 'SENDGRID');
    }
  }
}

module.exports = SendgridProvider;
