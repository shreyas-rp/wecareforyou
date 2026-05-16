'use strict';

const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/db');

const ROLES = ['admin', 'doctor', 'patient'];

/** Authentication root. One row per person who can sign in. */
class User extends Model {
  async setPassword(plain) {
    this.passwordHash = await bcrypt.hash(plain, 10);
  }
  comparePassword(plain) {
    return bcrypt.compare(plain, this.passwordHash);
  }
}

User.init(
  {
    name: { type: DataTypes.STRING, allowNull: false },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      set(v) {
        this.setDataValue('email', String(v).toLowerCase().trim());
      },
      validate: { isEmail: true },
    },
    passwordHash: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM(...ROLES), allowNull: false },
    phone: { type: DataTypes.STRING },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
  },
  { sequelize, modelName: 'User', tableName: 'users' }
);

module.exports = User;
module.exports.ROLES = ROLES;
