'use strict';

/**
 * Centralised, validated environment configuration.
 * Loads .env once and exposes a typed config object so the rest of the
 * codebase never reads process.env directly.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  mongoUri: process.env.MONGO_URI,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:4200',
  seed: {
    adminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@wecareforyou.com',
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin@123',
    doctorEmail: process.env.SEED_DOCTOR_EMAIL || 'doctor@wecareforyou.com',
    doctorPassword: process.env.SEED_DOCTOR_PASSWORD || 'Doctor@123',
    patientEmail: process.env.SEED_PATIENT_EMAIL || 'patient@wecareforyou.com',
    patientPassword: process.env.SEED_PATIENT_PASSWORD || 'Patient@123',
  },
};

/**
 * Fail fast if a critical variable is missing so the operator gets a clear,
 * non-technical message instead of an obscure driver error later.
 */
function assertConfig() {
  if (!config.mongoUri) {
    throw new Error(
      'MONGO_URI is not set. Copy server/.env.example to server/.env and ' +
        'provide your MongoDB Atlas connection string.'
    );
  }
}

module.exports = { config, assertConfig };
