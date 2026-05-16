'use strict';

/**
 * Application logger (winston).
 * Writes human-readable logs to the console and persistent logs to ./logs.
 * Used for diagnostics; user-facing errors are handled separately by the
 * central error handler so end users never see technical detail.
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');

const logsDir = path.resolve(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
    }),
  ],
});

// Always log to stdout — essential for Docker / `docker compose logs`.
// Colorized in dev; plain (no ANSI) in production.
logger.add(
  new winston.transports.Console({
    format: winston.format.combine(
      ...(process.env.NODE_ENV === 'production'
        ? []
        : [winston.format.colorize()]),
      winston.format.printf(
        ({ level, message, timestamp, stack }) =>
          `${timestamp} ${level}: ${stack || message}`
      )
    ),
  })
);

// Stream adapter so morgan request logs flow through winston.
logger.stream = {
  write: (message) => logger.info(message.trim()),
};

module.exports = logger;
