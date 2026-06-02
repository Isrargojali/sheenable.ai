// she-enable-ai-backend/src/errors/ProviderUnavailableError.js
class ProviderUnavailableError extends Error {
  constructor(message, providerName) {
    super(message);
    this.name = 'ProviderUnavailableError';
    this.statusCode = 503;
    this.providerName = providerName;
  }
}

module.exports = ProviderUnavailableError;
