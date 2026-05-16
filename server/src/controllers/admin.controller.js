'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const DEFAULT_DOCTOR_PASSWORD = 'Doctor@123';
const DEFAULT_PATIENT_PASSWORD = 'Patient@123';

/* ----------------------------- Doctors ----------------------------- */

/** GET /api/admin/doctors */
const listDoctors = asyncHandler(async (_req, res) => {
  const doctors = await Doctor.find()
    .populate({ path: 'userId', select: 'email phone isActive' })
    .sort('name')
    .lean();
  res.json({ success: true, data: doctors });
});

/**
 * POST /api/admin/doctors
 * Creates the login (User, role=doctor) + Doctor profile in one step.
 */
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

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = new User({ name, email, role: 'doctor', phone });
  await user.setPassword(password || DEFAULT_DOCTOR_PASSWORD);
  await user.save();

  const doctor = await Doctor.create({
    userId: user._id,
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
    data: doctor,
  });
});

/** PUT /api/admin/doctors/:id */
const updateDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found.');

  const fields = [
    'name',
    'specialty',
    'experienceYears',
    'qualification',
    'designation',
    'availability',
  ];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) doctor[f] = req.body[f];
  });
  await doctor.save();

  // Keep the linked login in sync.
  const userUpdate = {};
  if (req.body.name) userUpdate.name = req.body.name;
  if (req.body.phone !== undefined) userUpdate.phone = req.body.phone;
  if (req.body.email) userUpdate.email = req.body.email;
  if (Object.keys(userUpdate).length) {
    await User.findByIdAndUpdate(doctor.userId, userUpdate, {
      runValidators: true,
    });
  }

  res.json({ success: true, message: 'Doctor updated.', data: doctor });
});

/** DELETE /api/admin/doctors/:id - removes profile + login. */
const deleteDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id);
  if (!doctor) throw ApiError.notFound('Doctor not found.');
  await User.findByIdAndDelete(doctor.userId);
  await doctor.deleteOne();
  res.json({ success: true, message: 'Doctor deleted.' });
});

/* ----------------------------- Patients ---------------------------- */

/** GET /api/admin/patients */
const listPatients = asyncHandler(async (_req, res) => {
  const patients = await Patient.find()
    .populate({ path: 'userId', select: 'email phone isActive' })
    .sort('fullName')
    .lean();
  res.json({ success: true, data: patients });
});

/** POST /api/admin/patients */
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

  if (await User.findOne({ email: email.toLowerCase() })) {
    throw ApiError.conflict('An account with this email already exists.');
  }

  const user = new User({
    name: name || fullName,
    email,
    role: 'patient',
    phone: contactNumber,
  });
  await user.setPassword(password || DEFAULT_PATIENT_PASSWORD);
  await user.save();

  const patient = await Patient.create({
    userId: user._id,
    fullName: fullName || name,
    dateOfBirth: dateOfBirth || undefined,
    gender: gender || undefined,
    contactNumber,
    medicalHistory: medicalHistory || '',
  });

  res.status(201).json({
    success: true,
    message: 'Patient added successfully.',
    data: patient,
  });
});

/** PUT /api/admin/patients/:id */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw ApiError.notFound('Patient not found.');

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

  const userUpdate = {};
  if (req.body.fullName) userUpdate.name = req.body.fullName;
  if (req.body.contactNumber !== undefined)
    userUpdate.phone = req.body.contactNumber;
  if (req.body.email) userUpdate.email = req.body.email;
  if (Object.keys(userUpdate).length) {
    await User.findByIdAndUpdate(patient.userId, userUpdate, {
      runValidators: true,
    });
  }

  res.json({ success: true, message: 'Patient updated.', data: patient });
});

/** DELETE /api/admin/patients/:id */
const deletePatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findById(req.params.id);
  if (!patient) throw ApiError.notFound('Patient not found.');
  await User.findByIdAndDelete(patient.userId);
  await patient.deleteOne();
  res.json({ success: true, message: 'Patient deleted.' });
});

/* --------------------------- Appointments -------------------------- */

/** GET /api/admin/appointments */
const listAppointments = asyncHandler(async (_req, res) => {
  const appointments = await Appointment.find()
    .populate({ path: 'doctorId', select: 'name specialty' })
    .populate({ path: 'patientId', select: 'fullName contactNumber' })
    .sort({ createdAt: -1 })
    .lean();
  res.json({ success: true, data: appointments });
});

/** GET /api/admin/appointments/:id */
const getAppointment = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate({ path: 'doctorId', select: 'name specialty' })
    .populate({ path: 'patientId', select: 'fullName contactNumber' })
    .lean();
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  res.json({ success: true, data: appointment });
});

/** PUT /api/admin/appointments/:id/reschedule */
const rescheduleAppointment = asyncHandler(async (req, res) => {
  const { preferredDate, preferredTime } = req.body;
  const appointment = await Appointment.findById(req.params.id);
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (appointment.status === 'completed') {
    throw ApiError.badRequest('A completed appointment cannot be rescheduled.');
  }

  appointment.rescheduleHistory.push({
    previousDate: appointment.preferredDate,
    previousTime: appointment.preferredTime,
    newDate: preferredDate,
    newTime: preferredTime,
    by: 'admin',
  });
  appointment.preferredDate = preferredDate;
  appointment.preferredTime = preferredTime;
  appointment.status = 'rescheduled';
  await appointment.save();

  res.json({
    success: true,
    message: 'Appointment rescheduled.',
    data: appointment,
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
