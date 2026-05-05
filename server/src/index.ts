import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import session from 'express-session';

import authRoutes from './routes/auth.js';
import citiesRoutes from './routes/cities.js';
import homeRoutes from './routes/home.js';
import propertiesRoutes from './routes/properties.js';
import bookingsRoutes from './routes/bookings.js';
import { ApiResponse } from './types/index.js';

const app = express();
const PORT = process.env.PORT || 23139;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:33139';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'homestay_session_secret_key_2024',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.get('/health', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development',
    },
  };
  res.json(response);
});

app.use('/api/auth', authRoutes);
app.use('/api/cities', citiesRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/properties', propertiesRoutes);
app.use('/api/bookings', bookingsRoutes);

app.use('*', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    message: '接口不存在',
  };
  res.status(404).json(response);
});

app.use((err: Error, req: Request, res: Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  const response: ApiResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
  };
  res.status(500).json(response);
});

app.listen(PORT, () => {
  console.log(`\n========================================`);
  console.log(`  民宿预订平台后端服务已启动`);
  console.log(`  服务地址: http://localhost:${PORT}`);
  console.log(`  API 地址: http://localhost:${PORT}/api`);
  console.log(`  健康检查: http://localhost:${PORT}/health`);
  console.log(`========================================\n`);
});
