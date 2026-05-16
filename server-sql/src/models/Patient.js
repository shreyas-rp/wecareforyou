'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

/** Patient profile (1:1 with a User of role "patient"). */
class Patient extends Model {}

Patient.init(
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    dateOfBirth: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('Male', 'Female', 'Other') },
    contactNumber: { type: DataTypes.STRING },
    medicalHistory: { type: DataTypes.TEXT, defaultValue: '' },
  },
  { sequelize, modelName: 'Patient', tableName: 'patients' }
);

module.exports = Patient;
