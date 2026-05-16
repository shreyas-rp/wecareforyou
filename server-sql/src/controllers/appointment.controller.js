'use strict';

const { Op } = require('sequelize');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { serialize } = require('../utils/serialize');
const { Appointment, Doctor, Patient } = require('../models');
const { currentPatient } = require('./patient.controller');
const { currentDoctor } = require('./doctor.controller');

const UPCOMING = ['requested', 'confirmed', 'rescheduled'];

/** POST /api/appointments (patient) */
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

  const doctor = await Doctor.findByPk(doctorId);
  if (!doctor) throw ApiError.notFound('Selected doctor was not found.');

  const appointment = await Appointment.create({
    patientId: patient.id,
    doctorId,
    fullName,
    dateOfBirth: dateOfBirth || null,
    gender: gender || null,
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
    data: serialize(appointment),
  });
});

/** GET /api/appointments/mine?status=upcoming|completed (patient) */
const myAppointments = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  const { status } = req.query;

  const where = { patientId: patient.id };
  if (status === 'completed') where.status = 'completed';
  else if (status === 'upcoming') where.status = { [Op.in]: UPCOMING };

  const appointments = await Appointment.findAll({
    where,
    include: [
      { model: Doctor, as: 'doctor', attributes: ['id', 'name', 'specialty'] },
    ],
    order: [
      ['preferredDate', 'ASC'],
      ['preferredTime', 'ASC'],
    ],
  });
  res.json({ success: true, data: serialize(appointments) });
});

/** PUT /api/appointments/:id/reschedule (patient) */
const reschedule = asyncHandler(async (req, res) => {
  const patient = await currentPatient(req);
  const { preferredDate, preferredTime } = req.body;

  const appointment = await Appointment.findOne({
    where: { id: req.params.id, patientId: patient.id },
  });
  if (!appointment) throw ApiError.notFound('Appointment not found.');
  if (!UPCOMING.includes(appointment.status)) {
    throw ApiError.badRequest('Only upcoming appointments can be rescheduled.');
  }

  appointment.rescheduleHistory = [
    ...(appointment.rescheduleHistory || []),
    {
      previousDate: appointment.preferredDate,
      previousTime: appointment.preferredTime,
      newDate: preferredDate,
      newTime: preferredTime,
      by: 'patient',
      at: new Date().toISOString(),
    },
  ];
  appointment.preferredDate = preferredDate;
  appointment.preferredTime = preferredTime;
  appointment.status = 'rescheduled';
  await appointment.save();

  res.json({
    success: true,
    message: 'Appointment rescheduled.',
    data: serialize(appointment),
  });
});

/** PUT /api/doctor/appointments/:id/status (doctor) */
const updateStatus = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  const { action } = req.body;

  const appointment = await Appointment.findOne({
    where: { id: req.params.id, doctorId: doctor.id },
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
    data: serialize(appointment),
  });
});

/** PUT /api/doctor/appointments/:id/consultation (doctor) */
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
    where: { id: req.params.id, doctorId: doctor.id },
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
    completedAt: new Date().toISOString(),
  };
  appointment.status = 'completed';
  await appointment.save();

  res.json({
    success: true,
    message: 'Consultation saved. Appointment marked as completed.',
    data: serialize(appointment),
  });
});

module.exports = {
  bookAppointment,
  myAppointments,
  reschedule,
  updateStatus,
  captureConsultation,
};
