'use strict';

const { sequelize } = require('../config/db');
const User = require('./User');
const Patient = require('./Patient');
const Doctor = require('./Doctor');
const Appointment = require('./Appointment');
const Specialization = require('./Specialization');
const Medicine = require('./Medicine');
const MedicalTest = require('./MedicalTest');

/* ----------------------------- Associations -----------------------------
 * Alias names (user/doctor/patient) are intentionally chosen so the
 * serializer can rename them to the Mongo "ref" fields
 * (userId/doctorId/patientId) — keeping the API response shape identical.
 */
Patient.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasOne(Patient, { foreignKey: 'userId', as: 'patientProfile' });

Doctor.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasOne(Doctor, { foreignKey: 'userId', as: 'doctorProfile' });

Appointment.belongsTo(Doctor, { foreignKey: 'doctorId', as: 'doctor' });
Appointment.belongsTo(Patient, { foreignKey: 'patientId', as: 'patient' });
Doctor.hasMany(Appointment, { foreignKey: 'doctorId', as: 'appointments' });
Patient.hasMany(Appointment, { foreignKey: 'patientId', as: 'appointments' });

module.exports = {
  sequelize,
  User,
  Patient,
  Doctor,
  Appointment,
  Specialization,
  Medicine,
  MedicalTest,
};
