'use strict';

const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');

/**
 * GET /api/doctors?specialization=&search=
 * Public-ish (auth required) search used by patients to find a doctor.
 */
const searchDoctors = asyncHandler(async (req, res) => {
  const { specialization, search } = req.query;
  const filter = {};
  if (specialization) filter.specialty = specialization;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { specialty: { $regex: search, $options: 'i' } },
      { qualification: { $regex: search, $options: 'i' } },
    ];
  }
  const doctors = await Doctor.find(filter).sort('name').lean();
  res.json({ success: true, data: doctors });
});

/** GET /api/doctors/:id - public doctor profile. */
const getDoctor = asyncHandler(async (req, res) => {
  const doctor = await Doctor.findById(req.params.id).lean();
  if (!doctor) throw ApiError.notFound('Doctor not found.');
  res.json({ success: true, data: doctor });
});

/** Resolve the Doctor profile for the signed-in doctor user. */
async function currentDoctor(req) {
  const doctor = await Doctor.findOne({ userId: req.user._id });
  if (!doctor) throw ApiError.notFound('Doctor profile not found.');
  return doctor;
}

/** GET /api/doctor/me */
const getMyProfile = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  res.json({ success: true, data: doctor });
});

/** PUT /api/doctor/me - doctor updates own profile/availability. */
const updateMyProfile = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
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
  res.json({ success: true, message: 'Profile updated.', data: doctor });
});

/**
 * GET /api/doctor/appointments?status=upcoming|completed
 * Upcoming = requested/confirmed/rescheduled; completed = completed.
 */
const myAppointments = asyncHandler(async (req, res) => {
  const doctor = await currentDoctor(req);
  const { status } = req.query;

  const filter = { doctorId: doctor._id };
  if (status === 'completed') {
    filter.status = 'completed';
  } else if (status === 'upcoming') {
    filter.status = { $in: ['requested', 'confirmed', 'rescheduled'] };
  }

  const appointments = await Appointment.find(filter)
    .populate({ path: 'patientId', select: 'fullName contactNumber' })
    .sort({ preferredDate: 1, preferredTime: 1 })
    .lean();

  res.json({ success: true, data: appointments });
});

module.exports = {
  searchDoctors,
  getDoctor,
  getMyProfile,
  updateMyProfile,
  myAppointments,
  currentDoctor,
};
