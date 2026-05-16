'use strict';

const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { serialize } = require('../utils/serialize');
const { Doctor, Appointment, Patient } = require('../models');

/** GET /api/doctors?specialization=&search= */
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization, search } = req.query;
  const where = {};
  if (specialization) where.specialty = specialization;
  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { specialty: { [Op.like]: `%${search}%` } },
      { qualification: { [Op.like]: `%${search}%` } },
    ];
  }
  const doctors = await Doctor.findAll({ where, order: [['name', 'ASC']] });
  res.json({ success: true, data: serialize(doctors) });
});

/** GET /api/doctors/:id */
const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found.');
  res.json({ success: true, data: serialize(doctor) });
});

/** Resolve the Doctor profile for the signed-in doctor user. */
async function currentDoctor(req) {
  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  if (!doctor) throw ApiError.notFound('Doctor profile not found.');
  return doctor;
}

/** GET /api/doctor/me */
const getMyProfile = asyncHandler(async (req, res) => {
  res.json({ success: true, data: serialize(await currentDoctor(req)) });
});

/** PUT /api/doctor/me */
const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  for (const f of [
    'name',
    'specialty',
    'experienceYears',
    'qualification',
    'designation',
    'availability',
  ]) {
    if (req.body[f] !== undefined) doctor[f] = req.body[f];
  }
  await doctor.save();
  res.json({
    success: true,
    message: 'Profile updated.',
    data: serialize(doctor),
  });
});

/** GET /api/doctor/appointments?status=upcoming|completed */
const myAppointments = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  const { status } = req.query;

  const where = { doctorId: doctor.id };
  if (status === 'completed') where.status = 'completed';
  else if (status === 'upcoming')
    where.status = { [Op.in]: ['requested', 'confirmed', 'rescheduled'] };

  const appointments = await Appointment.findAll({
    where,
    include: [
      { model: Patient, as: 'patient', attributes: ['id', 'fullName', 'contactNumber'] },
    ],
    order: [
      ['preferredDate', 'ASC'],
      ['preferredTime', 'ASC'],
    ],
  });
  res.json({ success: true, data: serialize(appointments) });
});

module.exports = {
  searchDoctors,
  getDoctor,
  getMyProfile,
  updateMyProfile,
  myAppointments,
  currentDoctor,
};
