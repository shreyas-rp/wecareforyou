'use strict';

/**
 * Centralised, validated environment configuration for the MySQL variant.
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  db: {
    url: process.env.DATABASE_URL || null,
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    name: process.env.DB_NAME || 'wecareforyou',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    sync: String(process.env.DB_SYNC || 'true') === 'true',
  },
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

function assertConfig() {
  if (!config.db.url && !config.db.name) {
    throw new Error(
      'Database is not configured. Copy server-sql/.env.example to ' +
        'server-sql/.env and set DATABASE_URL or the DB_* variables.'
    );
  }
}

module.exports = { config, assertConfig };
