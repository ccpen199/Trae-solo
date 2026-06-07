import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/database.js';
import { loggerMiddleware } from './middleware/logger.js';

import authRoutes from './routes/auth.js';
import ticketRoutes from './routes/tickets.js';
import postRoutes from './routes/posts.js';
import merchantRoutes from './routes/merchants.js';
import marketRoutes from './routes/market.js';
import dashboardRoutes from './routes/dashboard.js';
import buildingRoutes from './routes/buildings.js';
import accessRoutes from './routes/access.js';
import feeRoutes from './routes/fees.js';
import aiRoutes from './routes/ai.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

initDatabase();

const app: express.Application = express();

const frontendPort = process.env.FRONTEND_PORT || '49041';
const corsOptions = {
  origin: [`http://127.0.0.1:${frontendPort}`, `http://localhost:${frontendPort}`],
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(loggerMiddleware);

app.get('/api/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req: Request, res: Response): void => {
  res.status(200).json({
    success: true,
    message: 'ok',
    timestamp: new Date().toISOString(),
  });
});

const demoAdmin = {
  id: 1,
  username: 'admin',
  role: 'admin',
  name: '系统管理员',
  phone: '13800138000',
  status: 'active',
};

app.get(['/api/users/profile', '/api/user/profile'], (req: Request, res: Response): void => {
  res.json({ success: true, data: demoAdmin });
});

app.get('/api/admin/stats', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      totalUsers: 128,
      totalBuildings: 12,
      activeTickets: 36,
      pendingFees: 18,
      serviceScore: 96,
    },
  });
});

app.get('/api/admin/dashboard', (req: Request, res: Response): void => {
  res.json({
    success: true,
    data: {
      user: demoAdmin,
      metrics: {
        totalUsers: 128,
        totalBuildings: 12,
        activeTickets: 36,
        pendingFees: 18,
      },
      modules: ['楼栋管理', '物业工单', '社区互动', '费用中心', '后台管理'],
    },
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/merchants', merchantRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/buildings', buildingRoutes);
app.use('/api/access', accessRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/ai', aiRoutes);

app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  });
});

app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

export default app;
