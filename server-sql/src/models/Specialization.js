'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Specialization extends Model {}

Specialization.init(
  {
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
  },
  { sequelize, modelName: 'Specialization', tableName: 'specializations' }
);

module.exports = Specialization;
