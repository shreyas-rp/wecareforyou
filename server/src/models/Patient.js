'use strict';

const mongoose = require('mongoose');

/**
 * Patient profile. One-to-one with a User of role "patient".
 */
const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    fullName: { type: String, required: true, trim: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ['Male', 'Female', 'Other'] },
    contactNumber: { type: String, trim: true },
    medicalHistory: { type: String, default: '', trim: true },
  },
  { timestamps: true }
);

patientSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Patient', patientSchema);
