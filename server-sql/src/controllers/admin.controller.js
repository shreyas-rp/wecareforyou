'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { serialize } = require('../utils/serialize');
const { User, Doctor, Patient, Appointment } = require('../models');

const DEFAULT_DOCTOR_PASSWORD = 'Doctor@123';
const DEFAULT_PATIENT_PASSWORD = 'Patient@123';

const USER_ATTRS = ['id', 'email', 'phone', 'isActive'];

/* ------------------------------ Doctors ------------------------------ */

const listDoctors = asyncHandler(async (_req, res) => {
  const doctors = await Doctor.findAll({
    include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
    order: [['name', 'ASC']],
  });
  res.json({ success: true, data: serialize(doctors) });
});

const createDoctor = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    phone,
    specialty,
    experienceYears,
    qualification,
    designation,
    availability,
  } = req.body;

  if (await User.findOne({ where: { email: email.toLowerCase() } })) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = User.build({ name, email, role: 'doctor', phone });
  await user.setPassword(password || DEFAULT_DOCTOR_PASSWORD);
  await user.save();

  const doctor = await Doctor.create({
    userId: user.id,
    name,
    specialty,
    experienceYears: experienceYears || 0,
    qualification,
    designation,
    availability: availability || [],
  });

  res.status(201).json({
    success: true,
    message: 'Doctor added successfully.',
    data: serialize(doctor),
  });
});

const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found.');

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

  const userPatch = {};
  if (req.body.name) userPatch.name = req.body.name;
  if (req.body.phone !== undefined) userPatch.phone = req.body.phone;
  if (req.body.email) userPatch.email = req.body.email;
  if (Object.keys(userPatch).length) {
    await User.update(userPatch, { where: { id: doctor.userId } });
  }

  res.json({ success: true, message: 'Doctor updated.', data: serialize(doctor) });
});

const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findByPk(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found.');
  const userId = doctor.userId;
  await doctor.destroy();
  await User.destroy({ where: { id: userId } });
  res.json({ success: true, message: 'Doctor deleted.' });
});

/* ------------------------------ Patients ----------------------------- */

const listPatients = asyncHandler(async (_req, res) => {
  const patients = await Patient.findAll({
    include: [{ model: User, as: 'user', attributes: USER_ATTRS }],
    order: [['fullName', 'ASC']],
  });
  res.json({ success: true, data: serialize(patients) });
});

const createPatient = asyncHandler(async (req, res) => {
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

  if (await User.findOne({ where: { email: email.toLowerCase() } })) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = User.build({
    name: name || fullName,
    email,
    role: 'patient',
    phone: contactNumber,
  });
  await user.setPassword(password || DEFAULT_PATIENT_PASSWORD);
  await user.save();

  const patient = await Patient.create({
    userId: user.id,
    fullName: fullName || name,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
    contactNumber,
    medicalHistory: medicalHistory || '',
  });

  res.status(201).json({
    success: true,
    message: 'Patient added successfully.',
    data: serialize(patient),
  });
});

const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) throw ApiError.notFound('Patient not found.');

  for (const f of [
    'fullName',
    'dateOfBirth',
    'gender',
    'contactNumber',
    'medicalHistory',
  ]) {
    if (req.body[f] !== undefined) patient[f] = req.body[f];
  }
  await patient.save();

  const userPatch = {};
  if (req.body.fullName) userPatch.name = req.body.fullName;
  if (req.body.contactNumber !== undefined)
    userPatch.phone = req.body.contactNumber;
  if (req.body.email) userPatch.email = req.body.email;
  if (Object.keys(userPatch).length) {
    await User.update(userPatch, { where: { id: patient.userId } });
  }

  res.json({
    success: true,
    message: 'Patient updated.',
    data: serialize(patient),
  });
});

const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findByPk(req.params.id);
  if (!patient) throw ApiError.notFound('Patient not found.');
  const userId = patient.userId;
  await patient.destroy();
  await User.destroy({ where: { id: userId } });
  res.json({ success: true, message: 'Patient deleted.' });
});

/* ---------------------------- Appointments --------------------------- */

const APPT_INCLUDE = [
  { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialty'] },
  { model: Patient, as: 'patient', attributes: ['id', 'fullName', 'contactNumber'] },
];

const listAppointments = asyncHandler(async (_req, res) => {
  const rows = await Appointment.findAll({
    include: APPT_INCLUDE,
    order: [['createdAt', 'DESC']],
  });
  res.json({ success: true, data: serialize(rows) });
});

const getAppointment = asyncHandler(async (req, res) => {
  const appt = await Appointment.findByPk(req.params.id, {
    include: APPT_INCLUDE,
  });
  if (!appt) throw ApiError.notFound('Appointment not found.');
  res.json({ success: true, data: serialize(appt) });
});

const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { preferredDate, preferredTime } = req.body;
  const appt = await Appointment.findByPk(req.params.id);
  if (!appt) throw ApiError.notFound('Appointment not found.');
  if (appt.status === 'completed') {
    throw ApiError.badRequest('A completed appointment cannot be rescheduled.');
  }

  appt.rescheduleHistory = [
    ...(appt.rescheduleHistory || []),
    {
      previousDate: appt.preferredDate,
      previousTime: appt.preferredTime,
      newDate: preferredDate,
      newTime: preferredTime,
      by: 'admin',
      at: new Date().toISOString(),
    },
  ];
  appt.preferredDate = preferredDate;
  appt.preferredTime = preferredTime;
  appt.status = 'rescheduled';
  await appt.save();

  res.json({
    success: true,
    message: 'Appointment rescheduled.',
    data: serialize(appt),
  });
});

module.exports = {
  listDoctors,
  createDoctor,
  updateDoctor,
  deleteDoctor,
  listPatients,
  createPatient,
  updatePatient,
  deletePatient,
  listAppointments,
  getAppointment,
  rescheduleAppointment,
};
