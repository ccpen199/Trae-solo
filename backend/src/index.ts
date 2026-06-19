import express from 'express';
import cors from 'cors';
import { initDatabase } from './database';
import { extractSubdomain, resolveCommunity } from './middleware/community';
import authRoutes from './routes/auth';
import residentsRoutes from './routes/residents';
import topicsRoutes from './routes/topics';
import skusRoutes from './routes/skus';
import ordersRoutes from './routes/orders';
import tasksRoutes from './routes/tasks';
import walletsRoutes from './routes/wallets';
import partnersRoutes from './routes/partners';
import propertyRoutes from './routes/property';
import adminRoutes from './routes/admin';
import type { AuthenticatedRequest } from './types';

const app = express();
const PORT = Number(process.env.PORT || 59242);
const HOST = process.env.HOST || '127.0.0.1';

app.use(cors());
app.use(express.json());

app.use(extractSubdomain);
app.use(resolveCommunity);

const healthHandler = (_req: express.Request, res: express.Response) => {
  res.json({
    success: true,
    status: 'ok',
    message: 'Neighborhood digital platform API is running',
    timestamp: new Date().toISOString(),
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

app.use('/api/auth', authRoutes);
app.use('/api/residents', residentsRoutes);
app.use('/api/topics', topicsRoutes);
app.use('/api/skus', skusRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/wallets', walletsRoutes);
app.use('/api/partners', partnersRoutes);
app.use('/api/property', propertyRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

initDatabase();

app.listen(PORT, HOST, () => {
  console.log(`Neighborhood platform server running at http://${HOST}:${PORT}`);
});

export default app;
