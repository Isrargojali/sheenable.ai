// she-enable-ai-backend/src/utils/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Ensure logs directory exists
const logDirectory = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    if (meta && Object.keys(meta).length > 0) {
      logMessage += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      logMessage += `\n${stack}`;
    }
    return logMessage;
  })
);

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Info level logs file transport
    new winston.transports.File({ 
      filename: path.join(logDirectory, 'info.log'), 
      level: 'info' 
    }),
    // Error level logs file transport
    new winston.transports.File({ 
      filename: path.join(logDirectory, 'error.log'), 
      level: 'error' 
    }),
    // Standard colored console transport
    new winston.transports.Console({
      format: consoleFormat
    })
  ]
});

module.exports = logger;
