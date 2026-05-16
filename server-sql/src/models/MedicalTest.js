'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class MedicalTest extends Model {}

MedicalTest.init(
  {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, modelName: 'MedicalTest', tableName: 'medical_tests' }
);

module.exports = MedicalTest;
