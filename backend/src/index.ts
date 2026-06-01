import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient } from './generated/prisma';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import applicationRoutes from './routes/applications';
import certificateRoutes from './routes/certificates';
import materialRoutes from './routes/materials';
import todoRoutes from './routes/todos';

export const prisma = new PrismaClient();
const app = express();
const PORT = process.env.BACKEND_PORT || 58813;

app.use(cors({
  origin: `http://127.0.0.1:${process.env.FRONTEND_PORT || 48813}`,
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/todos', todoRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/stats', async (req, res) => {
  try {
    const [productCount, customerCount, applicationCount, certificateCount, todoCount] = await Promise.all([
      prisma.qualificationProduct.count(),
      prisma.customer.count(),
      prisma.qualificationApplication.count(),
      prisma.qualificationCertificate.count(),
      prisma.todoItem.count({ where: { status: 'PENDING' } })
    ]);

    res.json({
      products: productCount,
      customers: customerCount,
      applications: applicationCount,
      certificates: certificateCount,
      pendingTodos: todoCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

async function initData() {
  const adminExists = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!adminExists) {
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        role: 'ADMIN',
        email: 'admin@example.com'
      }
    });

    await prisma.user.create({
      data: {
        username: 'agent',
        password: hashedPassword,
        name: '代办专员',
        role: 'AGENT',
        email: 'agent@example.com'
      }
    });

    await prisma.user.create({
      data: {
        username: 'auditor',
        password: hashedPassword,
        name: '审核专员',
        role: 'AUDITOR',
        email: 'auditor@example.com'
      }
    });

    console.log('Default users created: admin/admin123, agent/admin123, auditor/admin123');
  }
}

app.listen(PORT, '127.0.0.1', async () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
  await initData();
});

export default app;
