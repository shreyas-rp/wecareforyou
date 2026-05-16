'use strict';
/*
 * One-off end-to-end smoke test against a running API on :5000.
 * Seed-independent: it provisions its own doctor via the admin API, so it
 * works against any backend (Mongo or MySQL) and any seed (seed / seed:all).
 *   node server/scripts/smoke.js
 */
const BASE = 'http://localhost:5000/api';

async function call(method, path, body, token) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const ok = (label, cond, extra = '') =>
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${label}${extra ? ' :: ' + extra : ''}`);

(async () => {
  // 1. Admin login
  let r = await call('POST', '/auth/login', {
    email: 'admin@wecareforyou.com',
    password: 'Admin@123',
  });
  const adminTok = r.json.token;
  ok('admin login', r.status === 200 && !!adminTok);

  // 2. Admin provisions a dedicated doctor (known credentials)
  const docEmail = `smoke.doc.${Date.now()}@wecareforyou.com`;
  const docPass = 'Smoke@1234';
  r = await call(
    'POST',
    '/admin/doctors',
    {
      name: 'Dr. Smoke Test',
      email: docEmail,
      password: docPass,
      specialty: 'Cardiology',
      experienceYears: 9,
      qualification: 'MBBS, MD, DM (Cardiology)',
      designation: 'Consultant',
    },
    adminTok
  );
  const docId = r.json.data && r.json.data._id;
  ok('admin creates doctor', r.status === 201 && !!docId);

  // 3. Patient login
  r = await call('POST', '/auth/login', {
    email: 'patient@wecareforyou.com',
    password: 'Patient@123',
  });
  const patientTok = r.json.token;
  ok('patient login', r.status === 200 && !!patientTok);

  // 4. Doctor search returns the new doctor
  r = await call(
    'GET',
    '/doctors?specialization=Cardiology',
    null,
    patientTok
  );
  ok(
    'search doctors (Cardiology)',
    r.status === 200 && r.json.data.some((d) => d._id === docId)
  );

  // 5. Patient books an appointment with that doctor
  r = await call(
    'POST',
    '/appointments',
    {
      doctorId: docId,
      fullName: 'Demo Patient',
      gender: 'Female',
      contactNumber: '9000000003',
      symptomsDescription: 'Chest discomfort and fatigue',
      natureOfVisit: 'Specific medical issue',
      preferredDate: '2026-05-20',
      preferredTime: '10:30',
    },
    patientTok
  );
  const apptId = r.json.data && r.json.data._id;
  ok('patient books appointment', r.status === 201 && !!apptId);

  // 6. Doctor logs in (credentials we just created)
  r = await call('POST', '/auth/login', {
    email: docEmail,
    password: docPass,
  });
  const docTok = r.json.token;
  ok('doctor login', r.status === 200 && !!docTok);

  // 7. Doctor sees it as upcoming, then confirms
  r = await call('GET', '/doctor/appointments?status=upcoming', null, docTok);
  ok(
    'doctor upcoming list',
    r.status === 200 && r.json.data.some((a) => a._id === apptId)
  );

  r = await call(
    'PUT',
    `/doctor/appointments/${apptId}/status`,
    { action: 'confirm' },
    docTok
  );
  ok('doctor confirms', r.status === 200 && r.json.data.status === 'confirmed');

  // 8. Doctor records the consultation
  r = await call(
    'PUT',
    `/doctor/appointments/${apptId}/consultation`,
    {
      currentSymptoms: 'Exertional chest discomfort',
      physicalExamination: 'BP 130/85, pulse 78, no acute distress',
      treatmentPlan: 'Lifestyle changes, start medication, review in 2 weeks',
      diagnosis: 'Stable angina (suspected)',
      recommendedTests: ['ECG', 'Lipid Profile'],
      prescriptions: [
        { medicineName: 'Aspirin 75mg', dosage: '0-0-1', timing: 'AF', notes: '' },
        { medicineName: 'Atorvastatin 10mg', dosage: '0-0-1', timing: 'AF' },
      ],
    },
    docTok
  );
  ok(
    'doctor saves consultation',
    r.status === 200 && r.json.data.status === 'completed'
  );

  // 9. Patient sees the completed consultation + prescription
  r = await call('GET', '/appointments/mine?status=completed', null, patientTok);
  const done = r.json.data && r.json.data.find((a) => a._id === apptId);
  ok(
    'patient sees completed consult',
    !!done && done.consultation.diagnosis === 'Stable angina (suspected)'
  );
  ok(
    'prescription persisted',
    !!done && done.consultation.prescriptions.length === 2,
    done && done.consultation.prescriptions.map((p) => p.medicineName).join(', ')
  );

  // 10. Admin can list all appointments
  r = await call('GET', '/admin/appointments', null, adminTok);
  ok('admin lists appointments', r.status === 200 && Array.isArray(r.json.data));

  // 11. Forgot-password reset, then login with the new password
  r = await call('POST', '/auth/forgot-password', {
    email: 'patient@wecareforyou.com',
    newPassword: 'Patient@1234',
  });
  ok('forgot-password reset', r.status === 200);
  r = await call('POST', '/auth/login', {
    email: 'patient@wecareforyou.com',
    password: 'Patient@1234',
  });
  ok('login with new password', r.status === 200 && !!r.json.token);
  // restore original password so seeded creds keep working
  await call('POST', '/auth/forgot-password', {
    email: 'patient@wecareforyou.com',
    newPassword: 'Patient@123',
  });

  // 12. Role guard: patient cannot hit an admin route
  r = await call('GET', '/admin/doctors', null, patientTok);
  ok('role guard blocks patient on admin route', r.status === 403);
})().catch((e) => {
  console.error('SMOKE ERROR', e);
  process.exit(1);
});
