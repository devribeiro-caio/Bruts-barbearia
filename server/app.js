import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { env } from './config/env.js';
import { isDatabaseReady } from './config/database.js';
import { requireDatabase } from './middleware/requireDatabase.js';
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import appointmentRoutes from './routes/appointments.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { HttpError } from './utils/errors.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const clientDist = path.resolve(currentDir, '../client/dist');
const app = express();

app.disable('x-powered-by');
if (env.isProduction) app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
}));
app.use(express.json({ limit: '20kb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => {
  const ready = isDatabaseReady();
  res.status(ready ? 200 : 503).json({ status: ready ? 'ok' : 'database_unavailable' });
});

app.use('/api', requireDatabase);
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/admin', adminRoutes);

app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Rota da API não encontrada.')));
app.use(express.static(clientDist, { index: false, maxAge: env.isProduction ? '1h' : 0 }));
app.get('*', (_req, res, next) => {
  res.sendFile(path.join(clientDist, 'index.html'), (error) => {
    if (error) next(new HttpError(503, 'Frontend ainda não compilado. Execute npm run build.'));
  });
});

app.use((error, _req, res, _next) => {
  if (res.headersSent) return;
  if (error?.code === 11000) {
    return res.status(409).json({ error: 'Este registro já existe ou o horário foi reservado por outra pessoa.' });
  }
  if (error?.name === 'ValidationError') {
    return res.status(400).json({ error: 'Os dados informados são inválidos.' });
  }
  const status = Number.isInteger(error?.status) ? error.status : 500;
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status >= 500 ? 'Ocorreu um erro no servidor.' : error.message });
});

export default app;
