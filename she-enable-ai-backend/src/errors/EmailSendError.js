// she-enable-ai-backend/src/errors/EmailSendError.js
class EmailSendError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'EmailSendError';
    this.statusCode = 500;
    this.details = details;
  }
}

module.exports = EmailSendError;
