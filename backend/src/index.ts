import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import clusterRoutes from './routes/clusters';
import namespaceRoutes from './routes/namespaces';
import workloadRoutes from './routes/workloads';
import eventRoutes from './routes/events';
import publishRoutes from './routes/publish';
import operationRoutes from './routes/operations';
import dashboardRoutes from './routes/dashboard';

const app = express();
const PORT = parseInt(process.env.PORT || '53401', 10);
const HOST = process.env.HOST || '127.0.0.1';
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (_req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clusters', clusterRoutes);
app.use('/api/clusters/:clusterId/namespaces', namespaceRoutes);
app.use('/api/workloads', workloadRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/publish', publishRoutes);
app.use('/api/operations', operationRoutes);
app.use('/api', dashboardRoutes);

app.use((_req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误', data: null });
});

app.listen(PORT, HOST, () => {
  console.log(`K8s Governance Backend running at http://${HOST}:${PORT}`);
});

export default app;
