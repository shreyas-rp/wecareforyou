'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/auth.controller');

const router = express.Router();

const passwordRule = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters.')
  .matches(/[A-Z]/)
  .withMessage('Password must contain an uppercase letter.')
  .matches(/[a-z]/)
  .withMessage('Password must contain a lowercase letter.')
  .matches(/[0-9]/)
  .withMessage('Password must contain a number.')
  .matches(/[^A-Za-z0-9]/)
  .withMessage('Password must contain a special character.');

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Enter a valid email address.'),
    passwordRule,
    body('contactNumber')
      .optional({ values: 'falsy' })
      .matches(/^[0-9]{10}$/)
      .withMessage('Contact number must be 10 digits.'),
  ],
  validate,
  ctrl.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  ctrl.login
);

router.post(
  '/forgot-password',
  [
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/[A-Z]/)
      .withMessage('Password must contain an uppercase letter.')
      .matches(/[0-9]/)
      .withMessage('Password must contain a number.')
      .matches(/[^A-Za-z0-9]/)
      .withMessage('Password must contain a special character.'),
  ],
  validate,
  ctrl.forgotPassword
);

router.get('/me', authenticate, ctrl.me);

module.exports = router;
