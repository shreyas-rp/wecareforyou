'use strict';

const { Sequelize } = require('sequelize');
const { config } = require('./env');
const logger = require('../utils/logger');

/**
 * Single shared Sequelize instance (MySQL).
 * Built either from DATABASE_URL or the discrete DB_* settings.
 */
const sequelize = config.db.url
  ? new Sequelize(config.db.url, {
      dialect: 'mysql',
      logging: false,
    })
  : new Sequelize(config.db.name, config.db.user, config.db.password, {
      host: config.db.host,
      port: config.db.port,
      dialect: 'mysql',
      logging: false,
      pool: { max: 10, min: 0, idle: 10000 },
    });

/**
 * Connects (with a few retries — MySQL containers take a moment to accept
 * connections) and, in dev, syncs the schema from the models.
 */
async function connectDB({ sync } = {}) {
  const maxAttempts = 10;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await sequelize.authenticate();
      logger.info('MySQL connected.');
      break;
    } catch (err) {
      if (attempt === maxAttempts) {
        logger.error(`MySQL connection failed: ${err.message}`);
        throw new Error(
          'Could not connect to MySQL. Check the DB_* / DATABASE_URL ' +
            'settings in server-sql/.env and that the database is running.'
        );
      }
      logger.warn(
        `MySQL not ready (attempt ${attempt}/${maxAttempts}); retrying…`
      );
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  const doSync = sync !== undefined ? sync : config.db.sync;
  if (doSync) {
    await sequelize.sync({ alter: true });
    logger.info('Schema synced (sequelize.sync).');
  }
}

module.exports = { sequelize, connectDB };
