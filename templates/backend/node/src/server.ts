import { app } from './app.js';
import { env } from './config/env.js';
import { prisma } from './shared/database/prisma.js';
import { logger } from './shared/logger.js';

const server = app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, 'server started');
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'shutting down');
  server.close(() => {
    void prisma.$disconnect().finally(() => {
      process.exit(0);
    });
  });
};

process.on('SIGTERM', () => {
  shutdown('SIGTERM');
});

process.on('SIGINT', () => {
  shutdown('SIGINT');
});
