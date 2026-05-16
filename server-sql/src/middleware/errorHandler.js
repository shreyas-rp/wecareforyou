'use strict';

const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Central error handler. Logs technical detail server-side, returns a clean
 * user-readable message. Translates Sequelize errors to friendly text.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Something went wrong. Please try again.';
  let details = err.details;

  if (
    err.name === 'SequelizeValidationError' ||
    err.name === 'SequelizeDatabaseError'
  ) {
    statusCode = 400;
    details = (err.errors || []).map((e) => e.message);
    message = 'Please correct the highlighted fields and try again.';
  }

  if (err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 409;
    const field = (err.errors && err.errors[0] && err.errors[0].path) || 'value';
    message = `A record with that ${field} already exists.`;
  }

  if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'The request references an item that does not exist.';
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
    ...(details && details.length ? { details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
