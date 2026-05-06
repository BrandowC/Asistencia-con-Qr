import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env.js';
import { isDbReady } from './lib/db.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import authRoutes from './routes/auth.routes.js';
import institutionsRoutes from './routes/institutions.routes.js';
import unitsRoutes from './routes/units.routes.js';
import sessionsRoutes from './routes/sessions.routes.js';
import publicRoutes from './routes/public.routes.js';

export function buildApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.API_CORS_ORIGIN.split(',').map((s) => s.trim()),
      credentials: false,
    }),
  );
  app.use(express.json({ limit: '256kb' }));
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
  }

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'app-attendance-api', env: env.NODE_ENV });
  });
  app.get('/ready', (_req, res) => {
    res.status(isDbReady() ? 200 : 503).json({ ready: isDbReady() });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/institutions', institutionsRoutes);
  app.use('/api/units', unitsRoutes);
  app.use('/api/sessions', sessionsRoutes);
  app.use('/public', publicRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
