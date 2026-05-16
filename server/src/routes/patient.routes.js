'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const patientCtrl = require('../controllers/patient.controller');
const apptCtrl = require('../controllers/appointment.controller');

const router = express.Router();

router.use(authenticate, authorize('patient'));

router.get('/patient/me', patientCtrl.getMyProfile);
router.put('/patient/me', patientCtrl.updateMyProfile);

router.post(
  '/appointments',
  [
    body('doctorId').notEmpty().withMessage('Please select a doctor.'),
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('contactNumber')
      .matches(/^[0-9]{10}$/)
      .withMessage('Mobile number must be 10 digits.'),
    body('symptomsDescription')
      .trim()
      .notEmpty()
      .withMessage('Please describe your symptoms or concern.'),
    body('natureOfVisit')
      .trim()
      .notEmpty()
      .withMessage('Nature of the visit is required.'),
    body('preferredDate')
      .notEmpty()
      .withMessage('Preferred date is required.'),
    body('preferredTime')
      .notEmpty()
      .withMessage('Preferred time is required.'),
  ],
  validate,
  apptCtrl.bookAppointment
);

router.get('/appointments/mine', apptCtrl.myAppointments);

router.put(
  '/appointments/:id/reschedule',
  [
    body('preferredDate')
      .notEmpty()
      .withMessage('New preferred date is required.'),
    body('preferredTime')
      .notEmpty()
      .withMessage('New preferred time is required.'),
  ],
  validate,
  apptCtrl.reschedule
);

module.exports = router;
