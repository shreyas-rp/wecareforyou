'use strict';

const { DataTypes, Model } = require('sequelize');
const { sequelize } = require('../config/db');

class Medicine extends Model {}

Medicine.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    strength: { type: DataTypes.STRING },
  },
  {
    sequelize,
    modelName: 'Medicine',
    tableName: 'medicines',
    indexes: [{ unique: true, fields: ['name', 'strength'] }],
  }
);

module.exports = Medicine;
