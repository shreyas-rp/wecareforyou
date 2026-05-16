'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const doctorCtrl = require('../controllers/doctor.controller');
const apptCtrl = require('../controllers/appointment.controller');

const router = express.Router();

// Search (any authenticated user; used by patients).
router.get('/doctors', authenticate, doctorCtrl.searchDoctors);
router.get('/doctors/:id', authenticate, doctorCtrl.getDoctor);

// Doctor-only area.
router.use('/doctor', authenticate, authorize('doctor'));
router.get('/doctor/me', doctorCtrl.getMyProfile);
router.put('/doctor/me', doctorCtrl.updateMyProfile);
router.get('/doctor/appointments', doctorCtrl.myAppointments);

router.put(
  '/doctor/appointments/:id/status',
  [body('action').isIn(['confirm', 'reject', 'cancel']).withMessage('Invalid action.')],
  validate,
  apptCtrl.updateStatus
);

router.put(
  '/doctor/appointments/:id/consultation',
  [
    body('diagnosis').trim().notEmpty().withMessage('Diagnosis is required.'),
    body('prescriptions').optional().isArray().withMessage('Prescriptions must be a list.'),
    body('prescriptions.*.medicineName').optional().notEmpty().withMessage('Medicine name is required.'),
    body('prescriptions.*.dosage').optional().notEmpty().withMessage('Dosage is required.'),
    body('prescriptions.*.timing').optional().isIn(['AF', 'BF']).withMessage('Timing must be AF or BF.'),
  ],
  validate,
  apptCtrl.captureConsultation
);

module.exports = router;
