'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Patient = require('../models/Patient');

/** Resolve the Patient profile for the signed-in patient user. */
async function currentPatient(req) {
  const patient = await Patient.findOne({ userId: req.user._id });
  if (!patient) throw ApiError.notFound('Patient profile not found.');
  return patient;
}

/** GET /api/patient/me */
const getMyProfile = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  res.json({ success: true, data: patient });
});

/** PUT /api/patient/me - update personal details / medical history. */
const updateMyProfile = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  const fields = [
    'fullName',
    'dateOfBirth',
    'gender',
    'contactNumber',
    'medicalHistory',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) patient[f] = req.body[f];
  });
  await patient.save();
  res.json({ success: true, message: 'Profile updated.', data: patient });
});

module.exports = { getMyProfile, updateMyProfile, currentPatient };
