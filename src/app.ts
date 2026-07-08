import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import hpp from 'hpp';
import { pinoHttp } from 'pino-http';
import type { IncomingMessage } from 'node:http';
import { env, corsOrigins } from '@/config/env.js';
import { logger } from '@/lib/logger.js';
import docsRoutes from '@/docs/swagger.routes.js';
import routes from '@/routes/index.js';
import {
  globalRateLimiter,
  xssSanitize,
  mongoSanitize,
  csrfProtection,
  errorHandler,
  notFoundHandler,
} from '@/middleware/index.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', env.TRUST_PROXY);

  app.use(
    pinoHttp({
      logger,
      autoLogging: {
        ignore: (req: IncomingMessage) => {
          const url = req.url ?? '';
          return url.includes('/health');
        },
      },
    }),
  );

  app.use(
    helmet({
      contentSecurityPolicy: env.NODE_ENV === 'production',
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || corsOrigins.includes(origin) || corsOrigins.includes('*')) {
          callback(null, true);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
    }),
  );

  app.use(compression());
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));
  app.use(cookieParser());
  app.use(hpp());
  app.use(mongoSanitize);
  app.use(xssSanitize);
  app.use(globalRateLimiter);
  app.use(csrfProtection);

  if (env.DOCS_ENABLED) {
    app.use(env.API_PREFIX, docsRoutes);
  }

  app.use(env.API_PREFIX, routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
