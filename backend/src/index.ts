import express from 'express';
import { config } from './config';
import { initDatabase } from './database';
import { corsMiddleware } from './middleware/cors';
import authRouter from './routes/auth';
import devicesRouter from './routes/devices';
import ordersRouter from './routes/orders';
import paymentsRouter from './routes/payments';
import deviceApiRouter from './routes/device-api';
import adminRouter from './routes/admin';
import healthRouter from './routes/health';

const app = express();

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

initDatabase();

app.use('/api/auth', authRouter);
app.use('/api/devices', devicesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/payments', paymentsRouter);
app.use('/api/device', deviceApiRouter);
app.use('/api/admin', adminRouter);
app.use('/api/health', healthRouter);

app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在', data: null });
});

app.listen(config.port, config.bindHost, () => {
  console.log(`Server running on http://${config.bindHost}:${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
  console.log(`Database: ${config.dbPath}`);
});

export default app;
