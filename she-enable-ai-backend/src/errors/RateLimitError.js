// she-enable-ai-backend/src/errors/RateLimitError.js
class RateLimitError extends Error {
  constructor(message = 'Too many requests. Please try again later.') {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
  }
}

module.exports = RateLimitError;
