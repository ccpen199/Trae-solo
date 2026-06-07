/**
 * 安徽省一体化政务服务平台 API 服务端
 */

import 'express-async-errors';
import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import serviceRoutes from './routes/services.js';
import licenseRoutes from './routes/licenses.js';
import applicationRoutes from './routes/applications.js';
import monitorRoutes from './routes/monitor.js';
import { ServiceItemService } from './services/ServiceItemService.js';
import { MetricsService } from './services/MetricsService.js';

// for esm mode
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// load env
dotenv.config({ path: path.join(__dirname, '../.env'), override: true });

// initialize database
import './db.js';

const app: express.Application = express();

const FRONTEND_PORT = parseInt(process.env.FRONTEND_PORT || '49021');
const corsOptions = {
  origin: [
    `http://127.0.0.1:${FRONTEND_PORT}`,
    `http://localhost:${FRONTEND_PORT}`,
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined'));

function toCamelCase(key: string): string {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function transformKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(transformKeys);
  }
  if (obj && typeof obj === 'object') {
    const result: any = {};
    for (const key of Object.keys(obj)) {
      result[toCamelCase(key)] = transformKeys(obj[key]);
    }
    return result;
  }
  return obj;
}

app.use((req: Request, res: Response, next: NextFunction) => {
  const originalJson = res.json.bind(res);
  res.json = function (body: any) {
    let wrapped = body;
    if (body && typeof body === 'object' && !('success' in body)) {
      if (Array.isArray(body)) {
        wrapped = { success: true, data: body, total: body.length };
      } else if ('data' in body) {
        wrapped = { success: true, ...body };
      } else {
        wrapped = { success: true, data: body };
      }
    }
    return originalJson.call(this, transformKeys(wrapped));
  };
  next();
});

/**
 * API Routes
 */
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/licenses', licenseRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/metrics', monitorRoutes);

const serviceItemService = new ServiceItemService();
const metricsService = new MetricsService();

app.get('/api/user/profile', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: '演示管理员',
      userType: 'admin',
      phone: '13800000000',
      roles: ['admin', 'operator'],
    },
  });
});

app.get('/api/users/profile', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      id: 1,
      name: '演示管理员',
      userType: 'admin',
      phone: '13800000000',
      roles: ['admin', 'operator'],
    },
  });
});

app.get('/api/search', (req: Request, res: Response) => {
  const keyword = String(req.query.q || req.query.keyword || '');
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 10;
  const result = serviceItemService.search(keyword, 'all', page, pageSize);
  res.json({
    success: true,
    data: result.data,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  const overview = metricsService.getOverview();
  res.json({ success: true, data: overview });
});

app.get('/api/admin/dashboard', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      overview: metricsService.getOverview(),
      bottlenecks: metricsService.getBottleneckNodes(),
      departmentStats: metricsService.getDepartmentStats(),
      trend: metricsService.getDailyTrend(7),
    },
  });
});

app.get('/api/products', (req: Request, res: Response) => {
  const keyword = String(req.query.keyword || '');
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt((req.query.limit || req.query.pageSize) as string) || 12;
  const result = serviceItemService.search(keyword, 'all', page, limit);
  res.json({
    success: true,
    data: result.data,
    total: result.total,
    page: result.page,
    pageSize: result.pageSize,
  });
});

app.get('/api/orders', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: [
      {
        id: 1,
        orderNo: 'AH-DEMO-ORDER-001',
        serviceName: '社会保障卡申领',
        status: 'submitted',
        amount: 0,
        message: '政务服务平台以办件申请为订单提交主链路',
      },
    ],
    total: 1,
  });
});

app.get('/api/cart', (req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      items: [],
      total: 0,
      message: '政务服务平台无购物车，提交申请在事项详情页完成',
    },
  });
});

/**
 * error handler middleware
 */
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Server internal error',
  });
});

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  });
});

export default app;
