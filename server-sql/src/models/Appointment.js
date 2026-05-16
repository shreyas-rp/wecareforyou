'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

const STATUSES = [
  'requested',
  'confirmed',
  'rescheduled',
  'rejected',
  'cancelled',
  'completed',
];

/**
 * Appointment. The consultation block (symptoms, exam, treatment,
 * recommendedTests[], prescriptions[{medicineName,dosage,timing,notes}],
 * diagnosis) and reschedule history are stored as JSON columns to mirror
 * the original Mongo embedded documents 1:1.
 */
class Appointment extends Model {}

Appointment.init(
  {
    patientId: { type: DataTypes.INTEGER, allowNull: false },
    doctorId: { type: DataTypes.INTEGER, allowNull: false },

    fullName: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other') },
    contactNumber: { type: DataTypes.STRING, allowNull: false },
    symptomsDescription: { type: DataTypes.TEXT, allowNull: false },
    natureOfVisit: { type: DataTypes.STRING, allowNull: false },
    preferredDate: { type: DataTypes.DATEONLY, allowNull: false },
    preferredTime: { type: DataTypes.STRING, allowNull: false },

    status: { type: DataTypes.ENUM(...STATUSES), defaultValue: 'requested' },
    consultation: { type: DataTypes.JSON, defaultValue: {} },
    rescheduleHistory: { type: DataTypes.JSON, defaultValue: [] },
  },
  { sequelize, modelName: 'Appointment', tableName: 'appointments' }
);

module.exports = Appointment;
module.exports.STATUSES = STATUSES;
