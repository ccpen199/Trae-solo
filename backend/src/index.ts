import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import prisma from './config/database';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { success } from './utils/response';

import authRoutes from './routes/authRoutes';
import materialRoutes from './routes/materialRoutes';
import supplierRoutes from './routes/supplierRoutes';
import customerRoutes from './routes/customerRoutes';
import warehouseRoutes from './routes/warehouseRoutes';
import inventoryRoutes from './routes/inventoryRoutes';

const app = express();
const PORT = parseInt(process.env.PORT || '12227', 10);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:22271';

app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:22271'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json(success({ status: 'ok', timestamp: new Date().toISOString(), database: 'connected' }));
  } catch (err) {
    res.json(success({ status: 'ok', timestamp: new Date().toISOString(), database: 'disconnected' }));
  }
});

app.get('/api', (req, res) => {
  res.json(
    success({
      name: 'ERP System API',
      version: '1.0.0',
      endpoints: {
        auth: '/api/auth',
        materials: '/api/materials',
        suppliers: '/api/suppliers',
        customers: '/api/customers',
        warehouses: '/api/warehouses',
        inventory: '/api/inventory',
      },
    })
  );
});

app.use('/api/auth', authRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function bootstrap() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                    ERP System Backend                         ║
╠════════════════════════════════════════════════════════════╣
║  Server running on: http://localhost:${PORT}                     ║
║  Health check:      http://localhost:${PORT}/health             ║
║  API endpoint:      http://localhost:${PORT}/api                ║
╠════════════════════════════════════════════════════════════╣
║  Frontend URL:      ${FRONTEND_URL}                            ║
║  Port:              ${PORT}                                         ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  console.log('Database disconnected');
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await prisma.$disconnect();
  console.log('Database disconnected');
  process.exit(0);
});

export default app;
