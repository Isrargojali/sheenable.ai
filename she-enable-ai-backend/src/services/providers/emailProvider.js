// she-enable-ai-backend/src/services/providers/emailProvider.js
class EmailProvider {
  /**
   * Abstract signature for sending an email
   * @param {Object} options
   * @param {string} options.to
   * @param {string} options.subject
   * @param {string} options.html
   * @returns {Promise<string>} returns internal message ID or receipt
   */
  async send(options) {
    throw new Error('Method "send" must be implemented by the provider class.');
  }
}

module.exports = EmailProvider;
