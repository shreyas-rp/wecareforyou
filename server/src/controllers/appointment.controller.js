'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { currentPatient } = require('./patient.controller');
const { currentDoctor } = require('./doctor.controller');

const UPCOMING = ['requested', 'confirmed', 'rescheduled'];

/**
 * POST /api/appointments  (patient)
 * Books a new appointment with the chosen doctor.
 */
const bookAppointment = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  const {
    doctorId,
    fullName,
    dateOfBirth,
    gender,
    contactNumber,
    symptomsDescription,
    natureOfVisit,
    preferredDate,
    preferredTime,
  } = req.body;

  const doctor = await Doctor.findById(doctorId);
  if (!doctor) throw ApiError.notFound('Selected doctor was not found.');

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId,
    fullName,
    dateOfBirth: dateOfBirth || undefined,
    gender: gender || undefined,
    contactNumber,
    symptomsDescription,
    natureOfVisit,
    preferredDate,
    preferredTime,
    status: 'requested',
  });

  res.status(201).json({
    success: true,
    message: 'Appointment requested. The doctor will confirm shortly.',
    data: appointment,
  });
});

/**
 * GET /api/appointments/mine?status=upcoming|completed  (patient)
 */
const myAppointments = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  const { status } = req.query;

  const filter = { patientId: patient._id };
  if (status === 'completed') filter.status = 'completed';
  else if (status === 'upcoming') filter.status = { $in: UPCOMING };

  const appointments = await Appointment.find(filter)
    .populate({ path: 'doctorId', select: 'name specialty' })
    .sort({ preferredDate: 1, preferredTime: 1 })
    .lean();

  res.json({ success: true, data: appointments });
});

/**
 * PUT /api/appointments/:id/reschedule  (patient)
 * Patient changes the preferred date/time of an upcoming appointment.
 */
const reschedule = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  const { preferredDate, preferredTime } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    patientId: patient._id,
  });
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (!UPCOMING.includes(appointment.status)) {
    throw ApiError.badRequest('Only upcoming appointments can be rescheduled.');
  }

  appointment.rescheduleHistory.push({
    previousDate: appointment.preferredDate,
    previousTime: appointment.preferredTime,
    newDate: preferredDate,
    newTime: preferredTime,
    by: 'patient',
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

/**
 * PUT /api/appointments/:id/status  (doctor)
 * action = confirm | reject | cancel
 */
const updateStatus = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  const { action } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    doctorId: doctor._id,
  });
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (appointment.status === 'completed') {
    throw ApiError.badRequest('A completed appointment cannot be changed.');
  }

  const map = { confirm: 'confirmed', reject: 'rejected', cancel: 'cancelled' };
  const next = map[action];
  if (!next) throw ApiError.badRequest('Unknown action.');

  appointment.status = next;
  await appointment.save();

  res.json({
    success: true,
    message: `Appointment ${next}.`,
    data: appointment,
  });
});

/**
 * PUT /api/appointments/:id/consultation  (doctor)
 * Captures consulting details + prescription + recommended tests and marks
 * the appointment completed.
 */
const captureConsultation = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  const {
    currentSymptoms,
    physicalExamination,
    treatmentPlan,
    recommendedTests,
    prescriptions,
    diagnosis,
  } = req.body;

  const appointment = await Appointment.findOne({
    _id: req.params.id,
    doctorId: doctor._id,
  });
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (['rejected', 'cancelled'].includes(appointment.status)) {
    throw ApiError.badRequest(
      'Consultation cannot be recorded for a rejected or cancelled appointment.'
    );
  }

  appointment.consultation = {
    currentSymptoms,
    physicalExamination,
    treatmentPlan,
    recommendedTests: recommendedTests || [],
    prescriptions: prescriptions || [],
    diagnosis,
    completedAt: new Date(),
  };
  appointment.status = 'completed';
  await appointment.save();

  res.json({
    success: true,
    message: 'Consultation saved. Appointment marked as completed.',
    data: appointment,
  });
});

module.exports = {
  bookAppointment,
  myAppointments,
  reschedule,
  updateStatus,
  captureConsultation,
};
