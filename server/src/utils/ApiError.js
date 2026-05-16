'use strict';

/**
 * Operational error with an HTTP status and a user-readable message.
 * Thrown anywhere in the app; the central error handler turns it into a
 * clean JSON response (no stack traces or DB internals leak to the client).
 */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(msg = 'Invalid request.', details) {
    return new ApiError(400, msg, details);
  }
  static unauthorized(msg = 'Please sign in to continue.') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'You do not have permission to perform this action.') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'The requested item could not be found.') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'This record already exists.') {
    return new ApiError(409, msg);
  }
}

module.exports = ApiError;
