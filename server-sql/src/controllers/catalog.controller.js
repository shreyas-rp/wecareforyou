'use strict';

const asyncHandler = require('../utils/asyncHandler');
const { serialize } = require('../utils/serialize');
const { Specialization, Medicine, MedicalTest } = require('../models');

const specializations = asyncHandler(async (_req, res) => {
  const items = await Specialization.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: serialize(items) });
});

const medicines = asyncHandler(async (_req, res) => {
  const items = await Medicine.findAll({
    order: [
      ['name', 'ASC'],
      ['strength', 'ASC'],
    ],
  });
  res.json({ success: true, data: serialize(items) });
});

const tests = asyncHandler(async (_req, res) => {
  const items = await MedicalTest.findAll({ order: [['name', 'ASC']] });
  res.json({ success: true, data: serialize(items) });
});

module.exports = { specializations, medicines, tests };
