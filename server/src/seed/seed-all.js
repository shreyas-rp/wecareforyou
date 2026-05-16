'use strict';

/**
 * Comprehensive, idempotent demo seed.
 *
 *   npm run seed:all
 *
 * Populates EVERYTHING needed to use the app without any manual data entry:
 *   - reference catalogs (specializations, medicines, medical tests)
 *   - the admin account
 *   - 3 doctors for EVERY specialization (so every specialization in the
 *     patient "find a doctor" dropdown returns results)
 *   - 12 patients with login accounts
 *
 * Safe to run repeatedly: users are matched by email and upserted, so no
 * duplicates are created.
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

const DOCTORS_PER_SPECIALIZATION = 3;
const DOCTOR_PASSWORD = config.seed.doctorPassword; // Doctor@123
const PATIENT_PASSWORD = config.seed.patientPassword; // Patient@123

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Arjun', 'Rohan', 'Karthik', 'Vikram',
  'Suresh', 'Anil', 'Rahul', 'Ananya', 'Diya', 'Kavya', 'Anika', 'Meera',
  'Priya', 'Sneha', 'Pooja', 'Neha', 'Sara', 'Ishaan', 'Krishna', 'Reyansh',
  'Saanvi', 'Aadhya', 'Navya', 'Myra', 'Ira', 'Nikhil', 'Deepak',
];
const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Reddy', 'Nair', 'Iyer', 'Rao', 'Gupta',
  'Mehta', 'Kulkarni', 'Joshi', 'Menon', 'Pillai', 'Das', 'Bose', 'Khan',
  'Singh', 'Chopra', 'Banerjee', 'Mukherjee',
];

const QUALIFICATION_BY_SPECIALTY = {
  'General Medicine': 'MBBS, MD (General Medicine)',
  Cardiology: 'MBBS, MD, DM (Cardiology)',
  'Obstetrics and Gynecology': 'MBBS, MS (OBG)',
  Orthopedics: 'MBBS, MS (Orthopedics)',
  Pediatrics: 'MBBS, MD (Pediatrics)',
  Dermatology: 'MBBS, MD (Dermatology)',
  Neurology: 'MBBS, MD, DM (Neurology)',
  ENT: 'MBBS, MS (ENT)',
  Ophthalmology: 'MBBS, MS (Ophthalmology)',
  Psychiatry: 'MBBS, MD (Psychiatry)',
  Gastroenterology: 'MBBS, MD, DM (Gastroenterology)',
  Endocrinology: 'MBBS, MD, DM (Endocrinology)',
  Pulmonology: 'MBBS, MD (Pulmonology)',
  Nephrology: 'MBBS, MD, DM (Nephrology)',
  Urology: 'MBBS, MS, MCh (Urology)',
  Dentistry: 'BDS, MDS',
};

const DESIGNATIONS = [
  'Consultant',
  'Senior Consultant',
  'Associate Professor / Consultant',
  'Professor / Head of Department',
];

const AVAILABILITY_TEMPLATES = [
  [
    { day: 'Monday', from: '09:00', to: '13:00' },
    { day: 'Wednesday', from: '10:00', to: '14:00' },
    { day: 'Friday', from: '09:00', to: '12:00' },
  ],
  [
    { day: 'Tuesday', from: '10:00', to: '14:00' },
    { day: 'Thursday', from: '14:00', to: '18:00' },
    { day: 'Saturday', from: '09:00', to: '12:00' },
  ],
  [
    { day: 'Monday', from: '14:00', to: '18:00' },
    { day: 'Wednesday', from: '09:00', to: '12:00' },
    { day: 'Friday', from: '15:00', to: '19:00' },
  ],
];

const PATIENTS = [
  { name: 'Demo Patient', gender: 'Female', dob: '1995-06-15' },
  { name: 'Ramesh Iyer', gender: 'Male', dob: '1988-02-09' },
  { name: 'Sunita Sharma', gender: 'Female', dob: '1992-11-23' },
  { name: 'Imran Khan', gender: 'Male', dob: '1979-07-30' },
  { name: 'Lakshmi Nair', gender: 'Female', dob: '2001-03-12' },
  { name: 'Vikas Gupta', gender: 'Male', dob: '1985-09-05' },
  { name: 'Anjali Rao', gender: 'Female', dob: '1998-12-19' },
  { name: 'Joseph Thomas', gender: 'Male', dob: '1970-01-26' },
  { name: 'Fatima Sheikh', gender: 'Female', dob: '1994-08-14' },
  { name: 'Harpreet Singh', gender: 'Male', dob: '1990-04-02' },
  { name: 'Divya Menon', gender: 'Female', dob: '2003-05-21' },
  { name: 'Manoj Pillai', gender: 'Male', dob: '1982-10-08' },
];

const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

/** Create the user if it does not exist; never duplicates. Returns the user. */
async function upsertUser({ name, email, password, role, phone }) {
  let user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    user = new User({ name, email, role, phone });
    await user.setPassword(password);
    await user.save();
    return { user, created: true };
  }
  return { user, created: false };
}

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
    `Catalogs ready: ${SPECIALIZATIONS.length} specializations, ` +
      `${MEDICINES.length} medicines, ${MEDICAL_TESTS.length} tests.`
  );
}

async function seedAdmin() {
  const { created } = await upsertUser({
    name: 'System Admin',
    email: config.seed.adminEmail,
    password: config.seed.adminPassword,
    role: 'admin',
    phone: '9000000001',
  });
  logger.info(
    `Admin ${created ? 'created' : 'present'}: ${config.seed.adminEmail}`
  );
}

async function seedDoctors() {
  let index = 0;
  let createdCount = 0;

  for (const specialty of SPECIALIZATIONS) {
    for (let n = 1; n <= DOCTORS_PER_SPECIALIZATION; n++) {
      const first = FIRST_NAMES[index % FIRST_NAMES.length];
      const last = LAST_NAMES[index % LAST_NAMES.length];
      const name = `Dr. ${first} ${last}`;
      const email = `${slug(specialty)}.${n}@wecareforyou.com`;
      const phone = '9' + String(100000000 + index).slice(0, 9);

      const { user, created } = await upsertUser({
        name,
        email,
        password: DOCTOR_PASSWORD,
        role: 'doctor',
        phone,
      });
      if (created) createdCount++;

      await Doctor.updateOne(
        { userId: user._id },
        {
          userId: user._id,
          name,
          specialty,
          experienceYears: 4 + ((index * 3) % 26),
          qualification:
            QUALIFICATION_BY_SPECIALTY[specialty] || 'MBBS, MD',
          designation: DESIGNATIONS[index % DESIGNATIONS.length],
          availability: AVAILABILITY_TEMPLATES[n % AVAILABILITY_TEMPLATES.length],
        },
        { upsert: true }
      );
      index++;
    }
  }

  logger.info(
    `Doctors ready: ${index} total (${DOCTORS_PER_SPECIALIZATION} per ` +
      `specialization), ${createdCount} newly created.`
  );
}

async function seedPatients() {
  let createdCount = 0;
  for (let i = 0; i < PATIENTS.length; i++) {
    const p = PATIENTS[i];
    const email =
      i === 0 ? config.seed.patientEmail : `patient${i}@wecareforyou.com`;
    const phone = '8' + String(100000000 + i).slice(0, 9);

    const { user, created } = await upsertUser({
      name: p.name,
      email,
      password: PATIENT_PASSWORD,
      role: 'patient',
      phone,
    });
    if (created) createdCount++;

    await Patient.updateOne(
      { userId: user._id },
      {
        userId: user._id,
        fullName: p.name,
        dateOfBirth: new Date(p.dob),
        gender: p.gender,
        contactNumber: phone,
        medicalHistory: 'No significant past medical history.',
      },
      { upsert: true }
    );
  }
  logger.info(
    `Patients ready: ${PATIENTS.length} total, ${createdCount} newly created.`
  );
}

async function run() {
  try {
    assertConfig();
    await connectDB();

    await seedCatalogs();
    await seedAdmin();
    await seedDoctors();
    await seedPatients();

    logger.info('--------------------------------------------------');
    logger.info('Seed complete. You can log in with:');
    logger.info(
      `  Admin   : ${config.seed.adminEmail} / ${config.seed.adminPassword}`
    );
    logger.info(
      `  Doctors : <specialization>.<1-3>@wecareforyou.com / ${DOCTOR_PASSWORD}`
    );
    logger.info(
      '            e.g. cardiology.1@wecareforyou.com, ' +
        'pediatrics.2@wecareforyou.com'
    );
    logger.info(
      `  Patients: patient@wecareforyou.com / ${PATIENT_PASSWORD}`
    );
    logger.info(
      `            patient1..patient${PATIENTS.length - 1}` +
        `@wecareforyou.com / ${PATIENT_PASSWORD}`
    );
    logger.info('--------------------------------------------------');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    logger.error(`Seed failed: ${err.message}`);
    process.exit(1);
  }
}

run();
