'use strict';

const mongoose = require('mongoose');

const STATUSES = [
  'requested', // patient asked for it, awaiting doctor action
  'confirmed', // doctor accepted
  'rescheduled', // date/time changed (still upcoming)
  'rejected', // doctor declined
  'cancelled', // cancelled by patient/doctor/admin
  'completed', // consultation captured
];

/** A single prescribed medicine line, e.g. "0-0-1" + "AF". */
const prescriptionSchema = new mongoose.Schema(
  {
    medicineName: { type: String, required: true, trim: true },
    dosage: { type: String, required: true, trim: true }, // morning-noon-night, e.g. "1-0-1"
    timing: { type: String, enum: ['AF', 'BF'], required: true }, // After/Before Food
    notes: { type: String, trim: true },
  },
  { _id: false }
);

/** Consultation details captured by the doctor during/after the visit. */
const consultationSchema = new mongoose.Schema(
  {
    currentSymptoms: { type: String, trim: true },
    physicalExamination: { type: String, trim: true },
    treatmentPlan: { type: String, trim: true },
    recommendedTests: { type: [String], default: [] },
    prescriptions: { type: [prescriptionSchema], default: [] },
    diagnosis: { type: String, trim: true },
    completedAt: { type: Date },
  },
  { _id: false }
);

const rescheduleEntrySchema = new mongoose.Schema(
  {
    previousDate: Date,
    previousTime: String,
    newDate: Date,
    newTime: String,
    by: { type: String, enum: ['patient', 'doctor', 'admin'] },
    at: { type: Date, default: Date.now },
  },
  { _id: false }
);

const appointmentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Patient',
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },

    // Booking info supplied by the patient.
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    contactNumber: { type: String, required: true, trim: true },
    symptomsDescription: { type: String, required: true, trim: true },
    natureOfVisit: { type: String, required: true, trim: true },
    preferredDate: { type: Date, required: true },
    preferredTime: { type: String, required: true }, // "10:30"

    status: { type: String, enum: STATUSES, default: 'requested' },
    consultation: { type: consultationSchema, default: () => ({}) },
    rescheduleHistory: { type: [rescheduleEntrySchema], default: [] },
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, status: 1 });
appointmentSchema.index({ patientId: 1, status: 1 });

appointmentSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Appointment', appointmentSchema);
module.exports.STATUSES = STATUSES;
