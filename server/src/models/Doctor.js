'use strict';

const mongoose = require('mongoose');

const availabilitySlotSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      required: true,
    },
    from: { type: String, required: true }, // "09:00"
    to: { type: String, required: true }, // "13:00"
  },
  { _id: false }
);

/**
 * Doctor profile. One-to-one with a User of role "doctor".
 * Captures the attributes the admin enters when adding a doctor.
 */
const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true, trim: true },
    experienceYears: { type: Number, default: 0, min: 0 },
    qualification: { type: String, trim: true },
    designation: { type: String, trim: true },
    availability: { type: [availabilitySlotSchema], default: [] },
  },
  { timestamps: true }
);

doctorSchema.index({ specialty: 1 });

doctorSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('Doctor', doctorSchema);
