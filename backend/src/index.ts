import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { config } from './config';
import logger from './lib/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

const app = express();

app.use(cors({
  origin: ['http://localhost:5188', 'http://localhost:5189', 'http://localhost:5190'],
  credentials: true,
}));

app.use(compression());

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  next();
});

app.use('/api', routes);

app.get('/', (_req, res) => {
  res.json({
    name: 'Homestay Booking System API',
    version: '1.0.0',
    environment: config.env,
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      properties: '/api/properties',
      orders: '/api/orders',
      cleaning: '/api/cleaning',
    },
  });
});

app.use(notFoundHandler);

app.use(errorHandler);

const server = app.listen(config.port, () => {
  logger.info(`Server running on port ${config.port} (${config.env})`, {
    port: config.port,
    environment: config.env,
  });
});

process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', {
    reason: reason instanceof Error ? reason.message : reason,
  });
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

export default app;
