'use strict';

const mongoose = require('mongoose');
const { config } = require('./env');
const logger = require('../utils/logger');

/**
 * Connects to MongoDB Atlas. Resolves once connected; rejects with a clear
 * message the operator can act on (wrong URI / IP not allowlisted).
 */
async function connectDB() {
  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 15000,
    });
    logger.info('MongoDB connected.');
  } catch (err) {
    logger.error(`MongoDB connection failed: ${err.message}`);
    throw new Error(
      'Could not connect to the database. Verify MONGO_URI in server/.env ' +
        'and that your IP is allowlisted in MongoDB Atlas.'
    );
  }

  mongoose.connection.on('error', (err) =>
    logger.error(`MongoDB runtime error: ${err.message}`)
  );
  mongoose.connection.on('disconnected', () =>
    logger.warn('MongoDB disconnected.')
  );
}

module.exports = { connectDB };
