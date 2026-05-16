'use strict';

const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

function validate(req, _res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  const details = result.array().map((e) => e.msg);
  return next(
    ApiError.badRequest(
      'Please correct the highlighted fields and try again.',
      details
    )
  );
}

module.exports = validate;
