import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { loadProjectEnv } from './utils/loadEnv.js';

loadProjectEnv();

const app = express();
const riderOrigin = process.env.FRONTEND_URL || 'http://127.0.0.1:49312';
const adminOrigin = process.env.ADMIN_URL || 'http://127.0.0.1:49313';

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: [
    riderOrigin,
    adminOrigin,
    'http://127.0.0.1:49312',
    'http://127.0.0.1:49313',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    code: 200,
    message: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
    },
  });
});

app.use('/api', routes);
app.use('/api/v1', routes);

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    code: 404,
    message: `路由 ${req.method} ${req.originalUrl} 不存在`,
  });
});

export default app;
