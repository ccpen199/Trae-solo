import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import { corsMiddleware } from './middleware/cors.js';
import { initDatabase } from './models/database.js';
import { seedDatabase } from './seed/seedData.js';
import estatesRouter from './routes/estates.js';
import propertiesRouter from './routes/properties.js';
import brokersRouter from './routes/brokers.js';
import mapRouter from './routes/map.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.BACKEND_PORT || 59056);
const FRONTEND_PORT = Number(process.env.FRONTEND_PORT || 49056);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "http://127.0.0.1:49056", "http://127.0.0.1:59056"],
      imgSrc: ["'self'", "data:", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      fontSrc: ["'self'", "data:", "https:"],
      workerSrc: ["'self'", "blob:"],
    }
  }
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(corsMiddleware);

initDatabase();
seedDatabase();

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      frontendPort: FRONTEND_PORT,
      backendPort: PORT,
    },
  });
});

app.use('/api/estates', estatesRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/brokers', brokersRouter);
app.use('/api/map', mapRouter);
app.use('/api/admin', adminRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'API not found',
    path: req.path,
  });
});

app.use((err: Error, req: Request, res: Response) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

app.listen(PORT, HOST, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Backend server running`);
  console.log(`📍 Address: http://${HOST}:${PORT}`);
  console.log(`🌍 Frontend: http://127.0.0.1:${FRONTEND_PORT}`);
  console.log(`📊 API: http://${HOST}:${PORT}/api/health`);
  console.log(`========================================\n`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

export default app;
