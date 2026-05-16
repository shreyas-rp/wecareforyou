'use strict';

const asyncHandler = require('../utils/asyncHandler');
const Specialization = require('../models/Specialization');
const Medicine = require('../models/Medicine');
const MedicalTest = require('../models/MedicalTest');

/** GET /api/catalog/specializations */
const specializations = asyncHandler(async (_req, res) => {
  const items = await Specialization.find().sort('name').lean();
  res.json({ success: true, data: items });
});

/** GET /api/catalog/medicines */
const medicines = asyncHandler(async (_req, res) => {
  const items = await Medicine.find().sort('name strength').lean();
  res.json({ success: true, data: items });
});

/** GET /api/catalog/tests */
const tests = asyncHandler(async (_req, res) => {
  const items = await MedicalTest.find().sort('name').lean();
  res.json({ success: true, data: items });
});

module.exports = { specializations, medicines, tests };
