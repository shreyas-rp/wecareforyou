'use strict';

/**
 * Wraps an async route handler so any rejected promise is forwarded to the
 * central error handler instead of crashing the process or hanging the request.
 */
module.exports = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
