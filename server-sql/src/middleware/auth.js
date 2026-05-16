'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const ApiError = require('../utils/ApiError');
const { User } = require('../models');

/** Verifies the Bearer JWT and attaches the live user to req.user. */
async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) throw ApiError.unauthorized('Please sign in to continue.');

    let payload;
    try {
      payload = jwt.verify(token, config.jwt.secret);
    } catch {
      throw ApiError.unauthorized(
        'Your session has expired. Please sign in again.'
      );
    }

    const user = await User.findByPk(payload.sub);
    if (!user || !user.isActive) {
      throw ApiError.unauthorized('Account not found or disabled.');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

/** Restricts a route to one or more roles. Use after authenticate(). */
function authorize(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          'You do not have permission to access this resource.'
        )
      );
    }
    next();
  };
}

module.exports = { authenticate, authorize };
