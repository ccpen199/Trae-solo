import express from 'express';
import cors from 'cors';
import type { Request, Response, NextFunction } from 'express';
import authRouter from './routes/auth';
import calculatorRouter from './routes/calculator';
import transactionRouter from './routes/transaction';
import certificateRouter from './routes/certificate';
import policyRouter from './routes/policy';
import supportRouter from './routes/support';
import financeRouter from './routes/finance';
import adminRouter from './routes/admin';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = 4001;

app.use(cors());
app.use(express.json());

app.use((req: Request, _res: Response, next: NextFunction) => {
  const ts = new Date().toISOString();
  console.log(`[${ts}] ${req.method} ${req.path} - Body:`, JSON.stringify(req.body).slice(0, 200));
  next();
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRouter);
app.use('/api/calculator', calculatorRouter);
app.use('/api/transaction', transactionRouter);
app.use('/api/certificate', certificateRouter);
app.use('/api/policy', policyRouter);
app.use('/api/support', supportRouter);
app.use('/api/finance', financeRouter);
app.use('/api/admin', adminRouter);
app.use('/api/dashboard', dashboardRouter);

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({
    code: 500,
    message: err.message || 'Internal Server Error',
    data: null,
    timestamp: new Date().toISOString(),
    requestId: 'err_' + Math.random().toString(36).slice(2),
  });
});

app.listen(PORT, () => {
  console.log(`API Server running at http://localhost:${PORT}`);
});

export default app;
