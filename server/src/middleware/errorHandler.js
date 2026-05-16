'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

/** 404 fallback for unknown routes. */
function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Logs the technical detail server-side and returns a
 * clean, user-readable message to the client. Never leaks stack traces,
 * Mongoose internals, or driver errors.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';
  let details = err.details;

  // Mongoose validation -> friendly field messages.
  if (err.name === 'ValidationError') {
    statusCode = 400;
    details = Object.values(err.errors).map((e) => e.message);
    message = 'Please correct the highlighted fields and try again.';
  }

  // Invalid ObjectId etc.
  if (err.name === 'CastError') {
    statusCode = 400;
    message = 'The request contains an invalid identifier.';
  }

  // Duplicate key (unique index).
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    message = `A record with that ${field} already exists.`;
  }

  if (statusCode >= 500) {
    logger.error(
      `${req.method} ${req.originalUrl} -> ${err.stack || err.message}`
    );
    if (process.env.NODE_ENV === 'production') {
      message = 'Something went wrong on our side. Please try again later.';
    }
  } else {
    logger.warn(`${req.method} ${req.originalUrl} -> ${err.message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler, ApiError };
