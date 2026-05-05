import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';

dotenv.config();

import authRoutes from './routes/authRoutes';
import dailyLogRoutes from './routes/dailyLogRoutes';
import managerRoutes from './routes/managerRoutes';
import adminRoutes from './routes/adminRoutes';
import { sequelize, User, Department } from './models';
import { UserRole } from './types';
import { hashPassword } from './utils/auth';

const app = express();
const PORT = process.env.PORT || 11224;

app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['http://localhost:21224', 'http://127.0.0.1:21224', 'http://localhost:21225', 'http://127.0.0.1:21225'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/daily-logs', dailyLogRoutes);
app.use('/api/manager', managerRoutes);
app.use('/api/admin', adminRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: '服务器内部错误' });
});

const seedData = async () => {
  try {
    const existingAdmin = await User.findOne({ where: { username: 'admin' } });
    if (!existingAdmin) {
      const hashedPassword = await hashPassword('admin123');
      const admin = await User.create({
        username: 'admin',
        password: hashedPassword,
        name: '系统管理员',
        email: 'admin@example.com',
        phone: '13800000000',
        role: UserRole.ADMIN,
        isActive: true
      });
      console.log('Admin user created: admin / admin123');
    }

    const existingEmployee = await User.findOne({ where: { username: 'employee' } });
    if (!existingEmployee) {
      const hashedPassword = await hashPassword('employee123');
      const employee = await User.create({
        username: 'employee',
        password: hashedPassword,
        name: '张三',
        email: 'zhangsan@example.com',
        phone: '13800000001',
        role: UserRole.EMPLOYEE,
        isActive: true
      });
      console.log('Employee user created: employee / employee123');
    }

    const existingManager = await User.findOne({ where: { username: 'manager' } });
    if (!existingManager) {
      const hashedPassword = await hashPassword('manager123');
      const manager = await User.create({
        username: 'manager',
        password: hashedPassword,
        name: '李经理',
        email: 'manager@example.com',
        phone: '13800000002',
        role: UserRole.DEPT_MANAGER,
        isActive: true
      });
      console.log('Manager user created: manager / manager123');
    }

    const existingGM = await User.findOne({ where: { username: 'gm' } });
    if (!existingGM) {
      const hashedPassword = await hashPassword('gm123');
      const gm = await User.create({
        username: 'gm',
        password: hashedPassword,
        name: '王总',
        email: 'gm@example.com',
        phone: '13800000003',
        role: UserRole.GM,
        isActive: true
      });
      console.log('General Manager user created: gm / gm123');
    }

  } catch (error) {
    console.error('Error seeding data:', error);
  }
};

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection has been established successfully.');

    await sequelize.sync({ alter: true });
    console.log('Database synced successfully.');

    await seedData();

    app.listen(PORT, () => {
      console.log(`========================================`);
      console.log(`  日志管理系统 - 后端服务`);
      console.log(`========================================`);
      console.log(`  端口: ${PORT}`);
      console.log(`  访问地址: http://localhost:${PORT}`);
      console.log(`  健康检查: http://localhost:${PORT}/health`);
      console.log(`========================================`);
      console.log(`  测试账号:`);
      console.log(`    - 系统管理员: admin / admin123`);
      console.log(`    - 总经理: gm / gm123`);
      console.log(`    - 部门经理: manager / manager123`);
      console.log(`    - 员工: employee / employee123`);
      console.log(`========================================`);
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();

export default app;
