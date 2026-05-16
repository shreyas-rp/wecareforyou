'use strict';

const jwt = require('jsonwebtoken');
const { config } = require('../config/env');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { User, Patient, Doctor } = require('../models');

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
}

/** Build the auth "user" object exactly like the Mongo server did. */
async function attachProfile(user) {
  let profile = null;
  if (user.role === 'patient') {
    profile = await Patient.findOne({ where: { userId: user.id } });
  } else if (user.role === 'doctor') {
    profile = await Doctor.findOne({ where: { userId: user.id } });
  }
  return {
    id: String(user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    profileId: profile ? String(profile.id) : null,
  };
}

/** POST /api/auth/register — public patient self-registration. */
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

  const exists = await User.findOne({ where: { email: email.toLowerCase() } });
  if (exists) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = User.build({
    name,
    email,
    role: 'patient',
    phone: contactNumber,
  });
  await user.setPassword(password);
  await user.save();

  await Patient.create({
    userId: user.id,
    fullName: fullName || name,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    contactNumber: contactNumber || null,
    medicalHistory: medicalHistory || '',
  });

  res
    .status(201)
    .json({ success: true, message: 'Registration successful. Please sign in.' });
});

/** POST /api/auth/login */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Invalid email or password.');
  }
  if (!user.isActive) {
    throw ApiError.forbidden('This account has been disabled.');
  }

  res.json({
    success: true,
    message: 'Signed in successfully.',
    token: signToken(user),
    user: await attachProfile(user),
  });
});

/** POST /api/auth/forgot-password — simple in-app reset. */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
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

/** GET /api/auth/me */
const me = asyncHandler(async (req, res) => {
  res.json({ success: true, user: await attachProfile(req.user) });
});

module.exports = { register, login, forgotPassword, me };
