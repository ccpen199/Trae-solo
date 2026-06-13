import express from 'express';
import cors from 'cors';
import { rateLimiter } from './middleware/rateLimiter.js';
import { auditMiddleware } from './middleware/audit.js';
import authRoutes from './routes/auth.js';
import socialInsuranceRoutes from './routes/socialInsurance.js';
import certificationRoutes from './routes/certification.js';
import adminRoutes from './routes/admin.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(rateLimiter);
app.use(auditMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/social-insurance', socialInsuranceRoutes);
app.use('/api/certification', certificationRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ code: 0, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ code: 500, message: '服务器内部错误' });
});

export default app;
