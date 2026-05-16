'use strict';

/** Operational error with HTTP status + user-readable message. */
class ApiError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
  static badRequest(m = 'Invalid request.', d) {
    return new ApiError(400, m, d);
  }
  static unauthorized(m = 'Please sign in to continue.') {
    return new ApiError(401, m);
  }
  static forbidden(m = 'You do not have permission to perform this action.') {
    return new ApiError(403, m);
  }
  static notFound(m = 'The requested item could not be found.') {
    return new ApiError(404, m);
  }
  static conflict(m = 'This record already exists.') {
    return new ApiError(409, m);
  }
}

module.exports = ApiError;
