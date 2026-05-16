'use strict';

const app = require('./src/app');
const { config, assertConfig } = require('./src/config/env');
const { connectDB } = require('./src/config/db');
require('./src/models'); // register models + associations before sync
const logger = require('./src/utils/logger');

async function bootstrap() {
  try {
    assertConfig();
    await connectDB();
    app.listen(config.port, () => {
      logger.info(
        `WeCareForYou API (MySQL) listening on http://localhost:${config.port} (${config.env})`
      );
    });
  } catch (err) {
    logger.error(`Startup failed: ${err.message}`);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  logger.error(`Unhandled rejection: ${reason}`);
});

bootstrap();
