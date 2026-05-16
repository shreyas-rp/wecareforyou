'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');

function signToken(user) {
  return jwt.sign({ sub: user._id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/** Resolve the role-specific profile id so the client can use it directly. */
async function attachProfile(user) {
  let profile = null;
  if (user.role === 'patient') {
    profile = await Patient.findOne({ userId: user._id });
  } else if (user.role === 'doctor') {
    profile = await Doctor.findOne({ userId: user._id });
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profileId: profile ? profile._id : null,
  };
}

/**
 * POST /api/auth/register
 * Public self-registration for patients only.
 */
const register = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    fullName,
    dateOfBirth,
    gender,
    contactNumber,
    medicalHistory,
  } = req.body;

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = new User({
    name,
    email,
    role: 'patient',
    phone: contactNumber,
  });
  await user.setPassword(password);
  await user.save();

  await Patient.create({
    userId: user._id,
    fullName: fullName || name,
    dateOfBirth: dateOfBirth || undefined,
    gender: gender || undefined,
    contactNumber: contactNumber || undefined,
    medicalHistory: medicalHistory || '',
  });

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please sign in.',
  });
});

/**
 * POST /api/auth/login
 * Returns a JWT and the user profile (role drives client routing).
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash'
  );
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been disabled.');
  }

  const token = signToken(user);
  res.json({
    success: true,
    message: 'Signed in successfully.',
    token,
    user: await attachProfile(user),
  });
});

/**
 * POST /api/auth/forgot-password
 * Simple in-app reset: verify the email exists, set a new password.
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;

  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw ApiError.notFound('No account is registered with that email.');
  }

  await user.setPassword(newPassword);
  await user.save();

  res.json({
    success: true,
    message: 'Password updated. Please sign in with your new password.',
  });
});

/** GET /api/auth/me - current authenticated user. */
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: await attachProfile(req.user) });
});

module.exports = { register, login, forgotPassword, me };
