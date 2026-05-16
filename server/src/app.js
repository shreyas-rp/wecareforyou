'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const { config } = require('./config/env');
const logger = require('./utils/logger');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth.routes');
const catalogRoutes = require('./routes/catalog.routes');
const doctorRoutes = require('./routes/doctor.routes');
const patientRoutes = require('./routes/patient.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(compression());
app.use(morgan('combined', { stream: logger.stream }));

// Basic abuse protection on auth endpoints.
app.use(
  '/api/auth',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many attempts. Please wait a few minutes and try again.',
    },
  })
);

app.get('/api/health', (_req, res) =>
  res.json({ success: true, message: 'WeCareForYou API is running.' })
);

// Order matters: specific-prefix routers must be registered before the
// broad "/api" routers. patientRoutes applies a router-level
// authorize('patient') guard, so it must be mounted LAST or it would
// reject admin/doctor requests that fall through to it.
app.use('/api/auth', authRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', doctorRoutes);
app.use('/api', patientRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
