import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import corsMiddleware from './middleware/cors';
import { responseWrapper } from './middleware/responseWrapper';
import healthRoutes from './routes/healthRoutes';
import driverRoutes from './routes/driverRoutes';
import orderRoutes from './routes/orderRoutes';
import heatmapRoutes from './routes/heatmapRoutes';
import exceptionRoutes from './routes/exceptionRoutes';
import driverCreditRoutes from './routes/driverCreditRoutes';
import gpsRoutes from './routes/gpsRoutes';
import waybillRoutes from './routes/waybillRoutes';
import appealRoutes from './routes/appealRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import './db';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const app = express();
const PORT = parseInt(process.env.BACKEND_PORT || '59271', 10);
const HOST = '127.0.0.1';

app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(responseWrapper);

app.use('/api', healthRoutes);
app.use('/api/drivers', driverRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/heatmap', heatmapRoutes);
app.use('/api/exceptions', exceptionRoutes);
app.use('/api/exceptions/appeals', appealRoutes);
app.use('/api/appeals', appealRoutes);
app.use('/api/driver-credits', driverCreditRoutes);
app.use('/api/gps', gpsRoutes);
app.use('/api/waybills', waybillRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.listen(PORT, HOST, () => {
  console.log(`Server is running on http://${HOST}:${PORT}`);
});

export default app;
