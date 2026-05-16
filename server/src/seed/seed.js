'use strict';

/**
 * Idempotent database seed.
 *   npm run seed
 * Seeds the reference catalogs and three demo accounts (admin, doctor,
 * patient) plus a few extra doctors so the app is demoable immediately.
 * Safe to run repeatedly - it upserts rather than duplicating.
 */
const mongoose = require('mongoose');
const { config, assertConfig } = require('../config/env');
const { connectDB } = require('../config/db');
const logger = require('../utils/logger');

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Specialization = require('../models/Specialization');
const Medicine = require('../models/Medicine');
const MedicalTest = require('../models/MedicalTest');
const { SPECIALIZATIONS, MEDICINES, MEDICAL_TESTS } = require('./catalog.data');

async function seedCatalogs() {
  await Promise.all(
    SPECIALIZATIONS.map((name) =>
      Specialization.updateOne({ name }, { name }, { upsert: true })
    )
  );
  await Promise.all(
    MEDICINES.map((m) =>
      Medicine.updateOne(
        { name: m.name, strength: m.strength },
        m,
        { upsert: true }
      )
    )
  );
  await Promise.all(
    MEDICAL_TESTS.map((name) =>
      MedicalTest.updateOne({ name }, { name }, { upsert: true })
    )
  );
  logger.info(
    `Catalogs seeded: ${SPECIALIZATIONS.length} specializations, ` +
      `${MEDICINES.length} medicines, ${MEDICAL_TESTS.length} tests.`
  );
}

async function upsertUser({ name, email, password, role, phone }) {
  let user = await User.findOne({ email: email.toLowerCase() }).select(
    '+passwordHash'
  );
  if (!user) {
    user = new User({ name, email, role, phone });
    await user.setPassword(password);
    await user.save();
    logger.info(`Created ${role} account: ${email}`);
  }
  return user;
}

async function seedAccounts() {
  // Admin
  await upsertUser({
    name: 'System Admin',
    email: config.seed.adminEmail,
    password: config.seed.adminPassword,
    role: 'admin',
    phone: '9000000001',
  });

  // Primary demo doctor
  const docUser = await upsertUser({
    name: 'Dr. Poornima C',
    email: config.seed.doctorEmail,
    password: config.seed.doctorPassword,
    role: 'doctor',
    phone: '9000000002',
  });
  await Doctor.updateOne(
    { userId: docUser._id },
    {
      userId: docUser._id,
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
    },
    { upsert: true }
  );

  // A few extra doctors across specialties for a richer demo.
  const extraDoctors = [
    {
      email: 'arjun.cardio@wecareforyou.com',
      name: 'Dr. Arjun Mehta',
      specialty: 'Cardiology',
      experienceYears: 12,
      qualification: 'DM (Cardiology)',
      designation: 'Senior Consultant',
    },
    {
      email: 'kavya.peds@wecareforyou.com',
      name: 'Dr. Kavya Rao',
      specialty: 'Pediatrics',
      experienceYears: 8,
      qualification: 'MD (Pediatrics)',
      designation: 'Consultant',
    },
    {
      email: 'sanjay.ortho@wecareforyou.com',
      name: 'Dr. Sanjay Kumar',
      specialty: 'Orthopedics',
      experienceYears: 15,
      qualification: 'MS (Ortho)',
      designation: 'Professor / Consultant',
    },
    {
      email: 'neha.derma@wecareforyou.com',
      name: 'Dr. Neha Sharma',
      specialty: 'Dermatology',
      experienceYears: 6,
      qualification: 'MD (Dermatology)',
      designation: 'Consultant',
    },
  ];

  for (const d of extraDoctors) {
    const u = await upsertUser({
      name: d.name,
      email: d.email,
      password: config.seed.doctorPassword,
      role: 'doctor',
      phone: '90000000' + (10 + extraDoctors.indexOf(d)),
    });
    await Doctor.updateOne(
      { userId: u._id },
      {
        userId: u._id,
        name: d.name,
        specialty: d.specialty,
        experienceYears: d.experienceYears,
        qualification: d.qualification,
        designation: d.designation,
        availability: [
          { day: 'Tuesday', from: '09:00', to: '13:00' },
          { day: 'Thursday', from: '14:00', to: '18:00' },
        ],
      },
      { upsert: true }
    );
  }

  // Primary demo patient
  const patUser = await upsertUser({
    name: 'Demo Patient',
    email: config.seed.patientEmail,
    password: config.seed.patientPassword,
    role: 'patient',
    phone: '9000000003',
  });
  await Patient.updateOne(
    { userId: patUser._id },
    {
      userId: patUser._id,
      fullName: 'Demo Patient',
      dateOfBirth: new Date('1995-06-15'),
      gender: 'Female',
      contactNumber: '9000000003',
      medicalHistory: 'No significant past medical history.',
    },
    { upsert: true }
  );

  logger.info('Demo accounts ready.');
}

async function run() {
  try {
    assertConfig();
    await connectDB();
    await seedCatalogs();
    await seedAccounts();
    logger.info('Seed complete.');
    logger.info(
      `Admin:   ${config.seed.adminEmail} / ${config.seed.adminPassword}`
    );
    logger.info(
      `Doctor:  ${config.seed.doctorEmail} / ${config.seed.doctorPassword}`
    );
    logger.info(
      `Patient: ${config.seed.patientEmail} / ${config.seed.patientPassword}`
    );
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    process.exit(1);
  }
}

run();
