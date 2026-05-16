'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

/** Doctor profile (1:1 with a User of role "doctor"). */
class Doctor extends Model {}

Doctor.init(
  {
    userId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    specialty: { type: DataTypes.STRING, allowNull: false },
    experienceYears: { type: DataTypes.INTEGER, defaultValue: 0 },
    qualification: { type: DataTypes.STRING },
    designation: { type: DataTypes.STRING },
    // [{ day, from, to }] — kept as JSON to mirror the Mongo embedded array.
    availability: { type: DataTypes.JSON, defaultValue: [] },
  },
  { sequelize, modelName: 'Doctor', tableName: 'doctors' }
);

module.exports = Doctor;
