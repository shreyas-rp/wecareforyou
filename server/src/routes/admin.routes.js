'use strict';

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/admin.controller');

const router = express.Router();

router.use(authenticate, authorize('admin'));

/* Doctors */
router.get('/doctors', ctrl.listDoctors);
router.post(
  '/doctors',
  [
    body('name').trim().notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('specialty').trim().notEmpty().withMessage('Specialty is required.'),
    body('experienceYears')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Experience must be a positive number.'),
  ],
  validate,
  ctrl.createDoctor
);
router.put('/doctors/:id', ctrl.updateDoctor);
router.delete('/doctors/:id', ctrl.deleteDoctor);

/* Patients */
router.get('/patients', ctrl.listPatients);
router.post(
  '/patients',
  [
    body('email').isEmail().withMessage('Enter a valid email address.'),
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
    body('contactNumber')
      .optional({ values: 'falsy' })
      .matches(/^[0-9]{10}$/)
      .withMessage('Contact number must be 10 digits.'),
  ],
  validate,
  ctrl.createPatient
);
router.put('/patients/:id', ctrl.updatePatient);
router.delete('/patients/:id', ctrl.deletePatient);

/* Appointments */
router.get('/appointments', ctrl.listAppointments);
router.get('/appointments/:id', ctrl.getAppointment);
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
  ctrl.rescheduleAppointment
);

module.exports = router;
