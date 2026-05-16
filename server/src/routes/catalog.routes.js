'use strict';

const express = require('express');
const { authenticate } = require('../middleware/auth');
const ctrl = require('../controllers/catalog.controller');

const router = express.Router();

router.use(authenticate);
router.get('/specializations', ctrl.specializations);
router.get('/medicines', ctrl.medicines);
router.get('/tests', ctrl.tests);

module.exports = router;
