import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config/index.js';
import {
  oauthAuthorize,
  oauthToken,
  oauthRevoke,
  authenticate,
  getUserInfo
} from './middleware/oauth.js';

import riderRoutes from './routes/rider.js';
import orderRoutes from './routes/orders.js';
import gpsRoutes from './routes/gps.js';
import financeRoutes from './routes/finance.js';
import platformRoutes from './routes/platform.js';

const app = express();

const apiBaseUrl = `http://127.0.0.1:${config.port}`;
const apiLocalhostUrl = `http://localhost:${config.port}`;
const allowedOrigins = Array.from(new Set([
  config.corsOrigin,
  `http://127.0.0.1:${config.frontendPort}`,
  `http://localhost:${config.frontendPort}`
]));

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", ...allowedOrigins, apiBaseUrl, apiLocalhostUrl],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://trae-api-cn.mchost.guru"]
    }
  }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS origin not allowed: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    port: config.port
  });
});

app.get('/api/oauth/authorize', oauthAuthorize);
app.post('/api/oauth/token', oauthToken);
app.post('/api/oauth/revoke', oauthRevoke);
app.get('/api/userinfo', authenticate, getUserInfo);

app.use('/api/rider', riderRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/platform', platformRoutes);

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
    error_code: err.code || 'INTERNAL_ERROR',
    request_id: req.requestId
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.path });
});

const startServer = async () => {
  const isPortAvailable = await import('./utils/portCheck.js')
    .then(m => m.checkPort(config.port))
    .catch(() => true);

  if (!isPortAvailable) {
    console.error(`Port ${config.port} is already in use.`);
    console.error('Please run: ../scripts/port-manager.sh find');
    process.exit(1);
  }

  const server = app.listen(config.port, '127.0.0.1', () => {
    console.log(`🚀 Delivery Platform Backend running on http://127.0.0.1:${config.port}`);
    console.log(`   Health check: http://127.0.0.1:${config.port}/api/health`);
    console.log(`   CORS origins: ${allowedOrigins.join(', ')}`);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
};

startServer();
