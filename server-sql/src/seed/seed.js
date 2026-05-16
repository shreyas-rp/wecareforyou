'use strict';

/**
 * Lighter idempotent seed (MySQL): catalogs + demo admin/doctor/patient
 * accounts + a few named doctors. For the full dataset use `npm run seed:all`.
 */
const { config, assertConfig } = require('../config/env');
const { sequelize, connectDB } = require('../config/db');
const logger = require('../utils/logger');
const {
  User,
  Patient,
  Doctor,
  Specialization,
  Medicine,
  MedicalTest,
} = require('../models');
const { SPECIALIZATIONS, MEDICINES, MEDICAL_TESTS } = require('./catalog.data');

async function upsertUser({ name, email, password, role, phone }) {
  let user = await User.findOne({ where: { email: email.toLowerCase() } });
  if (!user) {
    user = User.build({ name, email, role, phone });
    await user.setPassword(password);
    await user.save();
    logger.info(`Created ${role} account: ${email}`);
  }
  return user;
}

async function upsertProfile(Model, userId, data) {
  const existing = await Model.findOne({ where: { userId } });
  if (existing) return existing.update(data);
  return Model.create({ userId, ...data });
}

async function seedCatalogs() {
  for (const name of SPECIALIZATIONS) {
    await Specialization.findOrCreate({ where: { name }, defaults: { name } });
  }
  for (const m of MEDICINES) {
    await Medicine.findOrCreate({
      where: { name: m.name, strength: m.strength },
      defaults: m,
    });
  }
  for (const name of MEDICAL_TESTS) {
    await MedicalTest.findOrCreate({ where: { name }, defaults: { name } });
  }
  logger.info(
    `Catalogs seeded: ${SPECIALIZATIONS.length} specializations, ` +
      `${MEDICINES.length} medicines, ${MEDICAL_TESTS.length} tests.`
  );
}

async function seedAccounts() {
  await upsertUser({
    name: 'System Admin',
    email: config.seed.adminEmail,
    password: config.seed.adminPassword,
    role: 'admin',
    phone: '9000000001',
  });

  const docUser = await upsertUser({
    name: 'Dr. Poornima C',
    email: config.seed.doctorEmail,
    password: config.seed.doctorPassword,
    role: 'doctor',
    phone: '9000000002',
  });
  await upsertProfile(Doctor, docUser.id, {
    name: 'Dr. Poornima C',
    specialty: 'Obstetrics and Gynecology',
    experienceYears: 18,
    qualification: 'MS (OG)',
    designation: 'Associate Professor / Consultant',
    availability: [
      { day: 'Monday', from: '09:00', to: '13:00' },
      { day: 'Wednesday', from: '10:00', to: '14:00' },
      { day: 'Friday', from: '09:00', to: '12:00' },
    ],
  });

  const extras = [
    { email: 'arjun.cardio@wecareforyou.com', name: 'Dr. Arjun Mehta', specialty: 'Cardiology', experienceYears: 12, qualification: 'DM (Cardiology)', designation: 'Senior Consultant' },
    { email: 'kavya.peds@wecareforyou.com', name: 'Dr. Kavya Rao', specialty: 'Pediatrics', experienceYears: 8, qualification: 'MD (Pediatrics)', designation: 'Consultant' },
    { email: 'sanjay.ortho@wecareforyou.com', name: 'Dr. Sanjay Kumar', specialty: 'Orthopedics', experienceYears: 15, qualification: 'MS (Ortho)', designation: 'Professor / Consultant' },
    { email: 'neha.derma@wecareforyou.com', name: 'Dr. Neha Sharma', specialty: 'Dermatology', experienceYears: 6, qualification: 'MD (Dermatology)', designation: 'Consultant' },
  ];
  for (let i = 0; i < extras.length; i++) {
    const d = extras[i];
    const u = await upsertUser({
      name: d.name,
      email: d.email,
      password: config.seed.doctorPassword,
      role: 'doctor',
      phone: '90000000' + (10 + i),
    });
    await upsertProfile(Doctor, u.id, {
      name: d.name,
      specialty: d.specialty,
      experienceYears: d.experienceYears,
      qualification: d.qualification,
      designation: d.designation,
      availability: [
        { day: 'Tuesday', from: '09:00', to: '13:00' },
        { day: 'Thursday', from: '14:00', to: '18:00' },
      ],
    });
  }

  const patUser = await upsertUser({
    name: 'Demo Patient',
    email: config.seed.patientEmail,
    password: config.seed.patientPassword,
    role: 'patient',
    phone: '9000000003',
  });
  await upsertProfile(Patient, patUser.id, {
    fullName: 'Demo Patient',
    dateOfBirth: '1995-06-15',
    gender: 'Female',
    contactNumber: '9000000003',
    medicalHistory: 'No significant past medical history.',
  });

  logger.info('Demo accounts ready.');
}

async function run() {
  try {
    assertConfig();
    await connectDB({ sync: true });
    await seedCatalogs();
    await seedAccounts();
    logger.info('Seed complete.');
    logger.info(`Admin:   ${config.seed.adminEmail} / ${config.seed.adminPassword}`);
    logger.info(`Doctor:  ${config.seed.doctorEmail} / ${config.seed.doctorPassword}`);
    logger.info(`Patient: ${config.seed.patientEmail} / ${config.seed.patientPassword}`);
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    process.exit(1);
  }
}

run();
