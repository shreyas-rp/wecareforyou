'use strict';

const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    strength: { type: String, trim: true }, // e.g. "500mg"
  },
  { timestamps: true }
);

medicineSchema.index({ name: 1, strength: 1 }, { unique: true });

module.exports = mongoose.model('Medicine', medicineSchema);
