import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { logger } from './utils/logger';
import { prisma } from './utils/prisma';
import { traceMiddleware } from './middleware/trace';
import { apiAccessMiddleware, errorHandler, notFoundHandler } from './middleware/access';

import authRoutes from './routes/auth.routes';
import orderRoutes from './routes/order.routes';
import vehicleRoutes from './routes/vehicle.routes';
import paymentRoutes from './routes/payment.routes';
import courierRoutes from './routes/courier.routes';
import approvalRoutes from './routes/approval.routes';
import adminRoutes from './routes/admin.routes';
import emsRoutes from './routes/ems.routes';
import receiptRoutes from './routes/receipt.routes';

import { startSlaMonitor } from './utils/slaMonitor';

const app = express();

app.use(helmet({ contentSecurityPolicy: config.env === 'production' ? undefined : false }));
app.use(cors({ origin: true, credentials: true, exposedHeaders: ['X-Trace-Id'] }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));
app.use(traceMiddleware);
app.use(apiAccessMiddleware);

app.get('/health', (_req, res) => {
  res.json({
    code: 0,
    message: 'ok',
    data: {
      status: 'UP',
      env: config.env,
      timestamp: Date.now(),
      version: '1.0.0',
      gdCities: config.gdCities,
    },
  });
});

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/vehicle', vehicleRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/courier', courierRoutes);
app.use('/api/v1/approval', approvalRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/ems', emsRoutes);
app.use('/api/v1/receipt', receiptRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function initCityConfigs() {
  const existing = await prisma.cityServiceConfig.count();
  if (existing > 0) return;
  const cities = [
    { city: '广州市', cityCode: '440100' },
    { city: '深圳市', cityCode: '440300' },
    { city: '珠海市', cityCode: '440400' },
    { city: '汕头市', cityCode: '440500' },
    { city: '佛山市', cityCode: '440600' },
    { city: '韶关市', cityCode: '440200' },
    { city: '湛江市', cityCode: '440800' },
    { city: '肇庆市', cityCode: '441200' },
    { city: '江门市', cityCode: '440700' },
    { city: '茂名市', cityCode: '440900' },
    { city: '惠州市', cityCode: '441300' },
    { city: '梅州市', cityCode: '441400' },
    { city: '汕尾市', cityCode: '441500' },
    { city: '河源市', cityCode: '441600' },
    { city: '阳江市', cityCode: '441700' },
    { city: '清远市', cityCode: '441800' },
    { city: '东莞市', cityCode: '441900' },
    { city: '中山市', cityCode: '442000' },
    { city: '潮州市', cityCode: '445100' },
    { city: '揭阳市', cityCode: '445200' },
    { city: '云浮市', cityCode: '445300' },
  ];
  await prisma.cityServiceConfig.createMany({
    data: cities.map(c => ({
      ...c,
      hotlinePhone: '11185',
      slaPickupMinutes: 120,
      slaProcessHours: 72,
    })),
  });
  logger.info(`[Init] Created ${cities.length} city service configs`);
}

async function initFundAccounts() {
  const accounts = [
    { accountNo: 'REG-ALL', accountType: 'REGULATORY' as const },
    ...config.gdCities.flatMap(city => [
      { accountNo: `REV-${city}`, accountType: 'SERVICE_REVENUE' as const, managedCity: city },
      { accountNo: `GOV-${city}`, accountType: 'GOVERNMENT_PAYABLE' as const, managedCity: city },
      { accountNo: `CUR-${city}`, accountType: 'COURIER_PAYABLE' as const, managedCity: city },
    ]),
  ];
  for (const acc of accounts) {
    await prisma.fundAccount.upsert({
      where: { accountNo: acc.accountNo },
      create: acc,
      update: {},
    });
  }
  logger.info(`[Init] Ensured ${accounts.length} fund accounts`);
}

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('[DB] Database connected');
    await initCityConfigs();
    await initFundAccounts();
    startSlaMonitor();

    app.listen(config.port, () => {
      logger.info(`[Server] Postal Gov Platform API running on port ${config.port} (${config.env})`);
      logger.info(`[Server] Health check: http://localhost:${config.port}/health`);
      logger.info(`[Server] API base: http://localhost:${config.port}/api/v1`);
    });
  } catch (err: any) {
    logger.error(`[Server] Startup failed: ${err.message}`, { stack: err.stack });
    process.exit(1);
  }
}

startServer();

process.on('SIGINT', async () => {
  logger.info('[Server] SIGINT received, shutting down...');
  await prisma.$disconnect();
  process.exit(0);
});
