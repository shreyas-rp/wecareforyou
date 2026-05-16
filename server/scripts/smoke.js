'use strict';
/* One-off end-to-end smoke test against a running API on :5000. */
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
  // 1. Patient login
  let r = await call('POST', '/auth/login', {
    email: 'patient@wecareforyou.com',
    password: 'Patient@123',
  });
  const patientTok = r.json.token;
  ok('patient login', r.status === 200 && !!patientTok);

  // 2. Search doctors
  r = await call('GET', '/doctors?specialization=Cardiology', null, patientTok);
  const doctor = r.json.data && r.json.data[0];
  ok('search doctors (Cardiology)', r.status === 200 && !!doctor, doctor && doctor.name);

  // 3. Book appointment
  r = await call('POST', '/appointments', {
    doctorId: doctor._id,
    fullName: 'Demo Patient',
    gender: 'Female',
    contactNumber: '9000000003',
    symptomsDescription: 'Chest discomfort and fatigue',
    natureOfVisit: 'Specific medical issue',
    preferredDate: '2026-05-20',
    preferredTime: '10:30',
  }, patientTok);
  const apptId = r.json.data && r.json.data._id;
  ok('patient books appointment', r.status === 201 && !!apptId);

  // 4. Doctor login (the cardiologist)
  r = await call('POST', '/auth/login', {
    email: 'arjun.cardio@wecareforyou.com',
    password: 'Doctor@123',
  });
  const docTok = r.json.token;
  ok('doctor login', r.status === 200 && !!docTok);

  // 5. Doctor sees upcoming + confirm
  r = await call('GET', '/doctor/appointments?status=upcoming', null, docTok);
  ok('doctor upcoming list', r.status === 200 && r.json.data.some((a) => a._id === apptId));

  r = await call('PUT', `/doctor/appointments/${apptId}/status`, { action: 'confirm' }, docTok);
  ok('doctor confirms', r.status === 200 && r.json.data.status === 'confirmed');

  // 6. Doctor records consultation
  r = await call('PUT', `/doctor/appointments/${apptId}/consultation`, {
    currentSymptoms: 'Exertional chest discomfort',
    physicalExamination: 'BP 130/85, pulse 78, no acute distress',
    treatmentPlan: 'Lifestyle changes, start medication, review in 2 weeks',
    diagnosis: 'Stable angina (suspected)',
    recommendedTests: ['ECG', 'Lipid Profile'],
    prescriptions: [
      { medicineName: 'Aspirin 75mg', dosage: '0-0-1', timing: 'AF', notes: '' },
      { medicineName: 'Atorvastatin 10mg', dosage: '0-0-1', timing: 'AF' },
    ],
  }, docTok);
  ok('doctor saves consultation', r.status === 200 && r.json.data.status === 'completed');

  // 7. Patient sees completed consultation with prescription
  r = await call('GET', '/appointments/mine?status=completed', null, patientTok);
  const done = r.json.data && r.json.data.find((a) => a._id === apptId);
  ok('patient sees completed consult', !!done && done.consultation.diagnosis === 'Stable angina (suspected)');
  ok('prescription persisted', !!done && done.consultation.prescriptions.length === 2,
     done && done.consultation.prescriptions.map((p) => p.medicineName).join(', '));

  // 8. Admin: login, list, create + delete a doctor
  r = await call('POST', '/auth/login', {
    email: 'admin@wecareforyou.com',
    password: 'Admin@123',
  });
  const adminTok = r.json.token;
  ok('admin login', r.status === 200 && !!adminTok);

  r = await call('GET', '/admin/appointments', null, adminTok);
  ok('admin lists appointments', r.status === 200 && Array.isArray(r.json.data));

  r = await call('POST', '/admin/doctors', {
    name: 'Dr. Smoke Test',
    email: `smoke_${Date.now()}@wecareforyou.com`,
    password: 'Smoke@1234',
    specialty: 'General Medicine',
    experienceYears: 5,
    qualification: 'MBBS',
    designation: 'Consultant',
  }, adminTok);
  const newDocId = r.json.data && r.json.data._id;
  ok('admin creates doctor', r.status === 201 && !!newDocId);

  r = await call('DELETE', `/admin/doctors/${newDocId}`, null, adminTok);
  ok('admin deletes doctor', r.status === 200);

  // 9. Forgot-password (simple in-app reset) then login with new password
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

  // 10. Role guard: patient cannot hit admin route
  r = await call('GET', '/admin/doctors', null, patientTok);
  ok('role guard blocks patient on admin route', r.status === 403);
})().catch((e) => {
  console.error('SMOKE ERROR', e);
  process.exit(1);
});
